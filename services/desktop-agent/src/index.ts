import { createPtyGateway, jwtVerifier } from '@pocketdev/pty-core';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config, shellArgs, terminalEnvironment } from './config';
import { createDesktopControlHandler, DesktopLinks } from './desktop-control';

const prisma = new PrismaClient();

// The desktop's own linked owner (from its access token). A PTY session runs an
// UNSANDBOXED shell on this host, so we bind it to this owner if specified.
function resolveOwnerId(): string | null {
  if (!config.token) return null;
  try {
    const decoded = jwt.verify(config.token, config.jwtSecret) as { sub?: string };
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}
const OWNER_ID = resolveOwnerId();
const linkedProjects = new DesktopLinks(
  config.stateFile,
  config.projectId
    ? {
        projectId: config.projectId,
        projectRoot: config.projectRoot,
      }
    : undefined,
);

// ── PTY gateway ──────────────────────────────────────────────────────────────
// The SAME PTY-over-WS server the cloud worker runs (via @pocketdev/pty-core),
// but the runner spawns a shell directly on THIS machine.
const gateway = createPtyGateway({
  port: config.port,
  host: config.bindHost,
  verify: jwtVerifier(config.jwtSecret),
  logger: (msg) => console.log(`[desktop-agent] ${msg}`),
  handleHttpRequest: createDesktopControlHandler({
    jwtSecret: config.jwtSecret,
    ownerId: OWNER_ID ?? (() => true),
    links: linkedProjects,
  }),

  resolveSpawn: (claims, ctx) => {
    if (OWNER_ID && claims.sub !== OWNER_ID) {
      throw new Error('unauthorized: PTY token owner is not this desktop’s linked user');
    }
    const projectRoot = linkedProjects.rootFor(claims.projectId) ?? config.projectRoot;
    if (!projectRoot) {
      throw new Error('unauthorized: project is not linked to this desktop folder');
    }
    return {
      command: config.shell,
      args: shellArgs(config.shell, ctx.command),
      cwd: projectRoot,
      env: terminalEnvironment(),
    };
  },

  onSessionExit: (claims, ctx, exitCode) => {
    // Best-effort: persist the desktop command's real outcome in the API.
    const token =
      config.token ||
      (claims?.sub
        ? jwt.sign({ sub: claims.sub, tier: 'FREE' }, config.jwtSecret, { expiresIn: '5m' })
        : undefined);
    void completeSession(ctx.sessionId, exitCode, token);
  },
});

async function completeSession(sessionId: string, exitCode: number, token?: string): Promise<void> {
  const authToken = token || config.token;
  if (!authToken) return;
  try {
    await fetch(`${config.apiUrl}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ exitCode }),
    });
  } catch {
    /* offline — the server's TTL/heartbeat window will reconcile */
  }
}

// ── Presence heartbeat ───────────────────────────────────────────────────────
// Advertise "this desktop is online at <tunnelUrl>" so the API routes execution
// here instead of the cloud (desktop-if-present-else-cloud).
async function heartbeat(): Promise<void> {
  const tunnelUrl = config.tunnelUrl || 'http://127.0.0.1:4000';
  const payload = {
    tunnelUrl,
    deviceName: config.deviceName,
    projects: linkedProjects.list(),
  };

  if (config.token) {
    try {
      await fetch(`${config.apiUrl}/desktop/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn(`[desktop-agent] heartbeat failed: ${(err as Error).message}`);
    }
    return;
  }

  // In development, heartbeat presence for all registered users in the database
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, tier: true } });
    for (const user of users) {
      const token = jwt.sign(
        { sub: user.id, email: user.email, tier: user.tier },
        config.jwtSecret,
        { expiresIn: '1h' },
      );
      await fetch(`${config.apiUrl}/desktop/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    console.warn(`[desktop-agent] dev multi-user heartbeat failed: ${(err as Error).message}`);
  }
}

async function goOffline(): Promise<void> {
  if (config.token) {
    try {
      await fetch(`${config.apiUrl}/desktop/offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.token}` },
      });
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, tier: true } });
    for (const user of users) {
      const token = jwt.sign(
        { sub: user.id, email: user.email, tier: user.tier },
        config.jwtSecret,
        { expiresIn: '1h' },
      );
      await fetch(`${config.apiUrl}/desktop/offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    /* ignore */
  }
}

const timer = setInterval(() => void heartbeat(), config.heartbeatMs);
void heartbeat();

console.log(`[desktop-agent] PTY-over-WS server on ws://${config.bindHost}:${config.port}`);
console.log(
  `[desktop-agent] shell=${config.shell} links=${linkedProjects.list().length}` +
    (config.projectId ? ` defaultProject=${config.projectId}` : ''),
);
console.log(
  `[desktop-agent] heartbeating to ${config.apiUrl} every ${config.heartbeatMs / 1000}s` +
    ` as ${config.tunnelUrl || 'http://127.0.0.1:4000'}`,
);

async function shutdown(): Promise<void> {
  console.log('[desktop-agent] shutting down …');
  clearInterval(timer);
  await goOffline();
  await prisma.$disconnect().catch(() => {});
  await gateway.close();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

