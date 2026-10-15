# PocketDev — Complete Project Overview

> Your dev machine in your pocket — sync your local codebase, then browse, edit, run, and
> commit it from your phone in a real terminal, with the PC powered off.

**Course:** COMP 207, Kathmandu University, Dept. of Computer Science and Engineering
**Type:** Year II / Semester II (4th semester) project


This document is the single consolidated reference: what the project is, how it is built,
what every process does, what talks to what, and what it depends on. The three companion
documents go deeper on their own slice:

| Document | Covers |
|---|---|
| [`PROJECT-BRIEF.md`](./PROJECT-BRIEF.md) | The pitch: problem, users, scope, definition of done |
| [`BUILD-PLAN.md`](./BUILD-PLAN.md) | The technical argument behind every stack choice + 14-week plan |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Step-by-step local verification, Cloudflare Tunnel, Oracle ARM deploy |
| [`docs/UI-UX.md`](./docs/UI-UX.md) | Mobile information architecture, component structure, design tokens |
| [`mobile/README.md`](./mobile/README.md) | Expo setup, EAS builds, device/simulator URLs |

---

## Table of contents

1. [What PocketDev is](#1-what-pocketdev-is)
2. [Why it exists](#2-why-it-exists)
3. [System architecture](#3-system-architecture)
4. [The repository](#4-the-repository)
5. [The five architectural decisions](#5-the-five-architectural-decisions)
6. [The backend, module by module](#6-the-backend-module-by-module)
7. [Data model](#7-data-model)
8. [The execution engine](#8-the-execution-engine)
9. [Wire protocols](#9-wire-protocols)
10. [The desktop runtime path](#10-the-desktop-runtime-path)
11. [The mobile app](#11-the-mobile-app)
12. [Integrations and external services](#12-integrations-and-external-services)
13. [Security posture](#13-security-posture)
14. [Configuration reference](#14-configuration-reference)
15. [Running it](#15-running-it)
16. [Status: built vs. blueprint](#16-status-built-vs-blueprint)

---

## 1. What PocketDev is

PocketDev is a **mobile-native cloud development environment**. A lightweight CLI agent on
your PC syncs a project folder to the backend. From then on the PC can be powered off: the
phone app browses the file tree, edits and saves files, opens a **real pseudo-terminal**
inside an isolated container, streams live command output, and runs Git operations —
commit, push, pull, diff, branch.

It is explicitly **not** a browser IDE shrunk onto a small screen. The client is a native
React Native app built touch-first, and commands run in an actual PTY inside a hardened
Docker container — either on a cloud VM or, when the developer's own desktop is online,
routed back to that machine through a tunnel.

**One line:** your dev machine in your pocket, running real code, no laptop required.

### The six things that must work

From the project's definition of done — from a phone, with the PC off:

1. A file can be edited and saved.
2. A command runs in a real terminal with live output visible.
3. A commit can be pushed.
4. The same command routes to the developer's own desktop when it's on, and falls back to
   the cloud VM when it's off.
5. A failed command gets an AI explanation.
6. The free tier visibly queues while the paid tier runs immediately.

---

## 2. Why it exists

Development is still chained to a laptop. Phones have the power and the ubiquity, but
nothing treats mobile as a first-class platform for real development work. Every existing
option solves one slice:

| | Codespaces / Gitpod / Replit | Termius | Working Copy | **PocketDev** |
|---|---|---|---|---|
| Native mobile, touch-first | No | Yes | Yes | **Yes** |
| Real terminal execution | Yes (browser) | Yes | No | **Yes** |
| File editing | Yes | No | Yes | **Yes** |
| Git workflow | Yes | No | Yes | **Yes** |
| Syncs from your existing local codebase | No | No | No | **Yes** |
| Runs on your own machine when it's on | No | No | No | **Yes** |
| Zero recurring cost path | No | No | No | **Yes** |

The two things nobody else does: **sync from an existing local codebase**, and **route
execution back to the developer's own desktop**.

Secondary motivation: every cloud IDE meters compute. That prices out students and
independent developers in cost-sensitive regions — hence the free tier and the
run-on-your-own-hardware path.

---

## 3. System architecture

Seven processes, all TypeScript. Three of them run on the server side, two are agents you
install on your PC, one is the phone app, and two are shared libraries.

```
   ┌──────────────────────┐
   │  PC · CLI sync agent │  chokidar watch + delta hashing
   │  @pocketdev/cli-agent│
   └───────────┬──────────┘
               │  WS /sync  ·  manifest → diff → changed files only
               ▼
┌──────────────────────────────┐   enqueue (priority)   ┌────────────────────────┐
│  PocketDev API   :3000       │ ────────────────────►  │  Redis                 │
│  NestJS modular monolith     │                        │  BullMQ queue          │
│                              │ ◄────────────────────  │  + pub/sub channels    │
│  · /sync        WS ingest    │   exec events          └───────────┬────────────┘
│  · REST modules              │   → reconcile                      │ consume
│  · BullMQ producer           │                                    │ (concurrency N)
│  · ExecutionReconciler       │                                    ▼
│  · /desktop/pty  WS proxy    │                        ┌────────────────────────┐
└───┬──────────┬───────────┬───┘                        │ Execution worker :4100 │
    │          │           │                            │ BullMQ consumer        │
    │ Prisma   │ writes    │ proxy                      │ + PTY gateway          │
    ▼          ▼           │                            └───────────┬────────────┘
┌────────┐ ┌───────────┐   │                                        │ docker exec
│Postgres│ │ File store│───┼── bind-mount /workspace ──────────────► │
└────────┘ │  on disk  │   │                            ┌───────────▼────────────┐
           └───────────┘   │                            │ Hardened Docker sandbox│
                           │                            │ node-pty · caps dropped│
                           ▼                            │ · optional gVisor      │
              ┌────────────────────┐                    └────────────────────────┘
              │ Cloudflare Tunnel  │
              └─────────┬──────────┘         ▲
                        │ WS PTY             │ WS PTY (wsToken, 5-min TTL)
                        ▼                    │
              ┌────────────────────┐   ┌─────┴──────────────────┐
              │ Desktop agent      │   │  Mobile app · Expo     │
              │ your own PC        │   │  iOS / Android         │
              │ heartbeat ─────────┼──►│  REST + JWT            │
              └────────────────────┘   └────────────────────────┘
```

### One command's journey

This is the whole system in seven steps:

1. **Phone** issues `POST /jobs` with `{ projectId, command }`, authenticated by a JWT.
2. **API** checks the daily quota on the user's `Subscription`, then resolves the
   execution target: if a `DesktopPresence` row for this user is `online`, has a
   `tunnelUrl`, is linked to this project, and heartbeat within
   `DESKTOP_HEARTBEAT_WINDOW_MS` (30 s), the target is `DESKTOP`; otherwise `CLOUD`.
3. **API** creates a `Job` + a `Session` row and mints a short-lived **PTY token**
   (`scope: "pty"`, 5-minute TTL) bound to `{ userId, sessionId, projectId }`.
4. For `CLOUD`, the API enqueues onto BullMQ with **priority 1 if the user is PAID, 10 if
   FREE** (lower number wins). It returns `{ jobId, sessionId, target, wsUrl, wsToken }`.
5. **Execution worker** picks the job up, provisions a hardened container bind-mounting
   the project's synced files at `/workspace`, publishes a `session-started` event onto
   Redis, and then **blocks its concurrency slot** until the session ends.
6. **Phone** opens a WebSocket to `wsUrl`, sends `{ type: "start", sessionId, projectId,
   token }`, and streams `data` frames from the real PTY. Input, resize and kill go the
   other way.
7. On exit the worker publishes `session-exited`; the API's **ExecutionReconciler**
   (subscribed to the Redis channel) writes the final status and exit code into Postgres.
   The worker itself never touches the database.

---

## 4. The repository

A **pnpm workspaces + Turborepo** monorepo. Node ≥ 20 (the repo runs 22), pnpm 10.28.2.

| Path | Package | Role |
|---|---|---|
| [`mobile/`](./mobile) | `@pocketdev/mobile` | React Native + Expo app (expo-router + NativeWind). The touch-first client. |
| [`server/`](./server) | `@pocketdev/server` | NestJS **modular monolith** — API, auth, projects, files, git, jobs, sessions, billing, desktop presence, AI assistant, and the BullMQ queue **producer**. |
| [`services/execution-worker/`](./services/execution-worker) | `@pocketdev/execution-worker` | The one split-out process — BullMQ **consumer**: Dockerode + node-pty + WebSocket PTY streaming. |
| [`services/cli-agent/`](./services/cli-agent) | `@pocketdev/cli-agent` | CLI sync agent — chokidar delta-sync over WebSocket. Binary name `pocketdev`. |
| [`services/desktop-agent/`](./services/desktop-agent) | `@pocketdev/desktop-agent` | Local desktop runtime — the same PTY-over-WS server plus a presence heartbeat, exposed via Cloudflare Tunnel. |
| [`packages/shared/`](./packages/shared) | `@pocketdev/shared` | Shared TypeScript contracts: queue payloads, PTY / sync / exec-event / git / file protocols, domain enums. |
| [`packages/pty-core/`](./packages/pty-core) | `@pocketdev/pty-core` | Shared PTY-over-WebSocket gateway (node-pty + `ws` + flow control + JWT). Used by **both** the cloud worker (Docker runner) and the desktop agent (host runner). |

Supporting directories: [`docs/`](./docs) (deployment + UI/UX), [`tests/`](./tests) (Vitest,
10 suites at the repo root), [`scripts/`](./scripts) (a raw PTY WebSocket client for manual
verification, plus a named-tunnel setup script), and `.pocketdev-store/` (the on-disk file
store — gitignored).

### Root scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `build` / `lint` / `typecheck` | Run the task across every workspace via Turbo |
| `pnpm test` | Vitest across the root `tests/` suites |
| `pnpm format` | Prettier over the repo |
| `pnpm server:dev` | NestJS API on `:3000` (watch mode) |
| `pnpm worker:dev` | Execution worker + PTY gateway on `:4100` |
| `pnpm mobile:dev` | Expo dev server (Metro) |
| `pnpm desktop:dev` | Desktop agent on `:4000` |
| `pnpm db:migrate` / `db:generate` | Prisma migrate / client generation |

---

## 5. The five architectural decisions

Argued in full in [`BUILD-PLAN.md`](./BUILD-PLAN.md); the conclusions and why they matter
in the code:

**1 · PostgreSQL + Prisma, not MongoDB.** The data is overwhelmingly relational — users →
projects → jobs → sessions, plus billing. The ~20% that is document-shaped (file manifests)
lives in a JSONB column (`Project.manifest`). ACID matters for job state; Prisma gives
type-safe DX shared with the rest of the TypeScript stack.

**2 · Modular monolith + exactly one worker, not microservices.** The NestJS modules *are*
the future service boundaries. The only legitimate seam today is the execution engine,
which has a different runtime profile (native `node-pty` addon, Docker socket access) and
is the untrusted-code blast radius. **Consequence enforced in code:** the worker never
touches Postgres. It publishes lifecycle events on a Redis pub/sub channel and the API's
`ExecutionReconciler` writes them through.

**3 · All TypeScript, no Go.** `node-pty` is a native Node addon; everything else is I/O
bound. A second language buys nothing and costs a build pipeline.

**4 · Reverse tunnel, not a custom relay.** Cloudflare Tunnel for the demo (outbound-only,
NAT/CGNAT traversal, no port forwarding, native WebSocket passthrough); Tailscale /
Headscale is the documented production path.

**5 · Docker alone is not a security boundary for untrusted code.** The demo layers gVisor
(`runsc`) behind a single env var; microVMs (Firecracker / Kata) are the production
blueprint.

---

## 6. The backend, module by module

**NestJS 11**, bootstrapped in [`server/src/main.ts`](./server/src/main.ts):

- A **global `JwtAuthGuard`** — every route requires a JWT unless decorated `@Public()`.
- A **global `ValidationPipe`** with `whitelist`, `forbidNonWhitelisted` and `transform`,
  so unknown body fields are rejected outright and DTOs are class-validated.
- CORS enabled (the Expo client is cross-origin), shutdown hooks enabled so Prisma / Redis
  / WebSocket servers close cleanly on `SIGINT`/`SIGTERM`.
- A **boot-time refusal**: in `NODE_ENV=production` with the default `JWT_SECRET`, the
  process throws. That secret also signs PTY tokens that the worker and desktop agent
  trust, so a leaked default would let anyone open a shell.
- [Bull Board](https://github.com/felixmosh/bull-board) mounted at `/admin/queues` behind
  basic auth.

`configuration.ts` walks up the tree looking for `pnpm-workspace.yaml` so that
`FILE_STORE_ROOT` resolves to the *same absolute directory* in the API and the worker
regardless of each process's working directory — the two must agree or the bind mount
points at nothing.

### Modules

| Module | Responsibility |
|---|---|
| `auth` | Register / login / `me`. bcryptjs password hashing, Passport JWT strategy, 7-day access tokens. |
| `users` | Profile lookup. |
| `projects` | CRUD over projects, plus linking a project to a desktop folder. |
| `files` | File tree, read, write, delete over the synced store. |
| `sync` | Raw-WebSocket `/sync` ingestion endpoint the CLI agent connects to. |
| `git` | Git-from-the-phone via `simple-git`, plus a streaming push-progress channel. |
| `jobs` | The queue producer: quota, target routing, PTY-token minting, BullMQ enqueue. |
| `sessions` | Session lifecycle and history. |
| `billing` | Subscription, tier upgrade / downgrade, daily quota bookkeeping. |
| `desktop` | Presence heartbeat, status, remote folder browsing, project linking, and a WebSocket proxy at `/desktop/pty`. |
| `execution` | `ExecutionReconciler` (Redis events → Postgres) and `ExecControlService` (kill signals). |
| `assistant` | Server-side terminal-output explanation via an OpenAI-compatible provider. |
| `health` | Liveness probe — also what the mobile connection screen pings. |
| `prisma` / `queue` | Infrastructure providers. |

### HTTP + WebSocket surface

| Endpoint | Notes |
|---|---|
| `POST /auth/register` · `POST /auth/login` | Public. Returns `{ accessToken, user }`. |
| `GET /auth/me` · `GET /users/me` | Current profile. |
| `GET /projects` · `POST /projects` · `GET /projects/:id` · `DELETE /projects/:id` | Project CRUD. |
| `POST /projects/:id/link` | Link a project to a desktop folder. |
| `GET /projects/:projectId/files` | Full file tree (`FileNode`). |
| `GET /projects/:projectId/file?path=` | Read one file (`FileContent`). |
| `PUT /projects/:projectId/file` | Write; `createOnly` flag makes it a create-if-absent. |
| `DELETE /projects/:projectId/file?path=` | Delete a file or folder. |
| `GET .../git/status` · `log` · `branches` · `diff` | Read-side Git. |
| `POST .../git/init` · `remote` · `commit` · `push` · `pull` | Write-side Git. |
| `POST .../git/push/start` + `GET .../git/push/progress` | Long push with live phase/percent feedback. |
| `GET /jobs` · `POST /jobs` · `GET /jobs/:id` | `POST` returns `StartSessionResponse`. |
| `GET /sessions` · `GET /sessions/history` | Active and historical sessions. |
| `POST /sessions/:id/close` · `POST /sessions/:id/complete` | Session teardown. |
| `GET /billing/subscription` · `POST /billing/upgrade` · `POST /billing/downgrade` | Demo tier switching. |
| `POST /desktop/heartbeat` · `POST /desktop/offline` · `GET /desktop/status` | Presence. |
| `GET /desktop/browse` · `POST /desktop/link` | Browse the desktop's drives/folders from the phone and link one to a project. |
| `POST /assistant/explain-terminal` | AI explanation of command output. |
| `GET /health` | Public liveness. |
| `WS /sync?token=` | CLI agent file ingestion. |
| `WS /desktop/pty?token=` | PTY proxy to the desktop agent's tunnel. |
| `GET /admin/queues` | Bull Board dashboard (basic auth). |

---

## 7. Data model

PostgreSQL via Prisma. Three migrations are checked in
(`20260713185212_initial_schema`, `20260724090000_link_desktop_projects`,
`20260727120000_desktop_browser_links`).

```
                    ┌──────────────┐  1:1   ┌────────────────┐
                    │ Subscription │◄───────│                │
                    └──────────────┘        │      User      │
                    ┌──────────────┐  1:1   │                │
                    │DesktopPresence│◄──────│                │
                    └──────────────┘        └───────┬────────┘
                                                    │ 1:N
                                                    ▼
   ┌─────────┐  1:1   ┌─────────┐  N:1   ┌────────────────────┐
   │ Session │◄───────│   Job   │───────►│      Project       │
   └─────────┘        └─────────┘        │  manifest = JSONB  │
                                          └────────────────────┘
```

| Model | Key fields |
|---|---|
| `User` | `email` (unique), `passwordHash`, `name`, `tier` (`FREE` \| `PAID`) |
| `Project` | `userId`, `name`, `slug` (unique per user), `desktopPath`, `desktopLinkedAt`, **`manifest` (JSONB — the sync file manifest)**, `lastSyncedAt` |
| `Job` | `projectId`, `userId`, `command`, `status` (`QUEUED`/`RUNNING`/`SUCCEEDED`/`FAILED`/`CANCELED`), `target` (`CLOUD`/`DESKTOP`), `queueJobId`, `exitCode`, `startedAt`, `finishedAt` |
| `Session` | `jobId` (unique, nullable), `projectId`, `userId`, `target`, `status` (`ACTIVE`/`CLOSED`), `containerId`, `startedAt`, `endedAt` |
| `Subscription` | `userId` (unique), `tier`, `status`, `quotaJobsPerDay` (default 50), `jobsUsedToday`, `quotaResetAt`, `renewsAt` |
| `DesktopPresence` | `userId` (unique), `projectId`, `projectRoot`, `deviceName`, **`linkedProjects` (JSONB)**, `online`, `tunnelUrl`, `lastHeartbeat` |

Notes: IDs are `cuid()`. `Job` and `Session` both carry a denormalised `userId` so ownership
checks never need a join. Cascade deletes flow from `User` down through `Project` → `Job` →
`Session`. Enums are mirrored as string-literal unions in
[`packages/shared/src/domain.ts`](./packages/shared/src/domain.ts) so every workspace shares
the vocabulary without depending on Prisma's generated client.

Seeding creates two demo accounts: `free@pocketdev.dev` and `paid@pocketdev.dev`, password
`password123`.

---

## 8. The execution engine

[`services/execution-worker/`](./services/execution-worker) — a plain Node process, not a
Nest app. It runs two things side by side: a **BullMQ `Worker`** consuming the `execution`
queue, and a **PTY-over-WebSocket gateway** on `:4100` that the phone connects to directly.

### Container hardening

Every session gets its own container (`services/execution-worker/src/docker.ts`):

- **Image:** `node:22-bookworm-slim` by default, pulled on demand.
- **Command:** the container just runs `sleep infinity`; user commands are `docker exec`'d
  into it, which is what lets one container back a long-lived interactive shell.
- **Capabilities:** `CapDrop: ["ALL"]`, then only `CHOWN`, `DAC_OVERRIDE`, `FOWNER`,
  `FSETID`, `SETGID`, `SETUID` added back — the minimum npm/pip need to extract tarballs and
  drop privileges. `NET_ADMIN`, `SYS_ADMIN`, `SYS_PTRACE` and friends stay dropped.
- **`no-new-privileges`** security option, so a setuid binary can't escalate.
- **cgroup caps:** `Memory` (512 MB default), `NanoCpus` (1 CPU), `PidsLimit` (256) — fork
  bombs and memory hogs hit a wall instead of the host.
- **tmpfs** for `/tmp` (64 MB) and `/run` (16 MB); optional read-only rootfs
  (`EXECUTION_READONLY=1`, off by default so demo builds work).
- **Network:** bridge by default so `npm install` works; `EXECUTION_NETWORK=0` switches to
  `--network none`.
- **Runtime:** `runc` by default, **`runsc` (gVisor) via one env var** — `EXECUTION_RUNTIME=runsc`.
- **Bind mount:** `${FILE_STORE_ROOT}/${userId}/${projectId}` → `/workspace`, so the
  container sees exactly the synced project and nothing else.
- **Labels** (`pocketdev=session`, plus session/job/user ids) drive `reapOrphans()`, a
  best-effort cleanup of leftover containers after a crash.

### The freemium mechanic

This is the subtle part, and it falls out of one design choice: **the worker's job handler
blocks its concurrency slot for the entire duration of the PTY session.** It doesn't return
when the container is provisioned; it returns when the terminal exits.

With `WORKER_CONCURRENCY=1` and three jobs:

```
time ──────────────────────────────────────────────────────────►
Job A · FREE  (prio 10)   ████████████ runs, holds the only slot
Job B · FREE  (prio 10)      ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ waiting ┄┄┄ ████ runs
Job C · PAID  (prio 1)          ┄┄┄┄┄┄┄ waiting ┄┄┄ ████████ runs
                                                 ▲
                          slot frees — BullMQ picks C, not B:
                          lower priority number wins, regardless of wait time
```

That is the visible free-vs-paid difference the demo is judged on, and it needs no separate
scheduler — BullMQ's priority queue does it. The tier is read from the **database** at
enqueue time, not from the JWT claim, so a demo upgrade takes effect immediately without
forcing a re-login.

### Timeouts

| Setting | Default | Meaning |
|---|---|---|
| `SESSION_CONNECT_TIMEOUT_S` | 60 | Worker holds a provisioned container this long waiting for the phone to attach, then releases the slot. |
| `SESSION_QUEUE_WAIT_S` | 300 | How long a connected client waits for its queued job to be scheduled — long enough to sit behind an active free-tier session. |
| `SESSION_MAX_DURATION_S` | 1800 | Hard wall-clock cap on any one session. |

### Reconciliation

The worker publishes `session-started`, `session-exited` and `session-error` on the Redis
channel `pocketdev:exec:events`. The API's `ExecutionReconciler` subscribes and writes them
into Postgres. A **BullMQ `QueueEvents` listener is the backstop**: if the worker dies
without emitting `session-exited`, the queue's own `failed` event still lets the API fail
the job instead of leaving it stuck in `RUNNING` forever. The reverse channel,
`pocketdev:exec:control`, carries API-initiated `kill-session` signals (teardown reports
exit code 137).

---

## 9. Wire protocols

All three live in [`packages/shared/src/`](./packages/shared/src) as discriminated unions,
so producer and consumer can't drift.

### File sync — `sync-protocol.ts`

rsync-style delta transfer. The agent computes a manifest of `{ path, size, mtimeMs, hash }`
per file; the server diffs it against the stored manifest and asks only for what changed.

```
agent → server   { type: "manifest", projectId, manifest }
server → agent   { type: "diff",     projectId, diff: { changed[], removed[] } }
agent → server   { type: "file",     projectId, path, contentBase64 }   ×N
agent → server   { type: "removed",  projectId, path }                  ×N
agent → server   { type: "done",     projectId }
server → agent   { type: "synced",   projectId }
```

Transport is a raw `ws` server attached to Nest's HTTP upgrade at `/sync`, authenticated by
a `?token=<jwt>` query parameter. The stored manifest lands in `Project.manifest` (JSONB)
once `done` arrives.

### Terminal — `pty-protocol.ts`

```
client → server   { type: "start",  sessionId, projectId, command?, cols?, rows?, token? }
                  { type: "input",  sessionId, data }
                  { type: "resize", sessionId, cols, rows }
                  { type: "kill",   sessionId }

server → client   { type: "ready",  sessionId }
                  { type: "data",   sessionId, data }
                  { type: "exit",   sessionId, exitCode }
                  { type: "error",  sessionId, message }
```

The token may ride in the `start` frame or as `?token=` on the URL. The gateway that speaks
this protocol lives in [`packages/pty-core`](./packages/pty-core) and is **shared verbatim**
by the cloud worker and the desktop agent — the only difference between them is the
`resolveSpawn` callback (docker exec vs. a shell on this host) and the `verify` callback.

**Flow control:** the gateway watches the socket's send buffer. Above 1 MiB buffered it
pauses the PTY; once it drains below 256 KiB (polled every 50 ms) it resumes. Without this a
`yarn install` firehose overruns a phone on a slow link and output is silently dropped.

### Execution events — `exec-events.ts`

The worker→API coordination contract described in §8. `SessionStartedEvent` carries
`containerId`; `SessionExitedEvent` carries `exitCode` and `durationMs`;
`SessionErrorEvent` carries a message. All timestamped ISO strings.

Also shared: `git-protocol.ts` (status/log/branch/diff/commit/push-progress shapes and the
`parseGitPushProgressLine` parser), `files.ts` (`FileNode`, `FileContent`, `WriteFileResult`),
`session-api.ts` (`StartSessionResponse`, `PtyTokenClaims`), `desktop.ts`, `queue.ts`,
`domain.ts`.

---

## 10. The desktop runtime path

The differentiator: when your own machine is on, your code runs there.

**[`services/desktop-agent/`](./services/desktop-agent)** runs on your PC and does two things:

1. **Heartbeats presence** to `POST /desktop/heartbeat` with its device name, tunnel URL and
   linked projects. The API stores this in `DesktopPresence`. A desktop counts as online
   only if it beat within `DESKTOP_HEARTBEAT_WINDOW_MS` (30 s).
2. **Serves the same PTY gateway** as the cloud worker — but `resolveSpawn` launches a real
   shell (`pwsh`/`cmd` on Windows, `bash` elsewhere) directly on the host, `cwd`'d to the
   linked project folder. It also serves a small HTTP control surface used by the phone's
   folder browser.

`cloudflared` exposes the agent's port `:4000` outbound-only — no port forwarding, works
behind NAT and CGNAT, and passes WebSocket through natively.

### Two authorisation checks that matter

A desktop PTY session spawns an **unsandboxed shell on someone's personal machine**. Since
every PocketDev process shares one `JWT_SECRET`, a valid token from *any* user would
otherwise be accepted. The agent therefore:

- Decodes **its own** access token at boot to derive `OWNER_ID`, and refuses any PTY token
  whose `sub` is not that owner. An unlinked agent (no token) authorises nobody.
- Requires the requested `projectId` to be **linked to an actual folder** on this machine,
  and the token's `projectId` to match the one in the `start` frame.

On the API side, `/desktop/pty` is a WebSocket **proxy**: the phone connects to the API with
its PTY token, the API validates it against the session record and forwards the stream to
the desktop's tunnel. The phone never needs to know the tunnel URL.

**[`services/cli-agent/`](./services/cli-agent)** is the other PC-side process — `chokidar`
file watching plus manifest hashing, run as `pocketdev sync ./folder -p <projectId>` with
`POCKETDEV_TOKEN` in the environment.

---

## 11. The mobile app

**Expo SDK 57 · React Native 0.86 · React 19.2 · expo-router · NativeWind 4.**
Bundle id `com.billjeshbaidya.pocketdev` (iOS and Android), EAS-built. Expo Go is not
sufficient — the app has custom native modules (`llama.rn`, keyboard-controller), so it
needs a development client.

### Screens

| Route | What it does |
|---|---|
| `(auth)/login` · `register` · `server` | Email auth, plus a **runtime API-server picker** with a `/health` connection check — you can repoint the app at another backend without rebuilding. |
| `(tabs)/home` | Project list, create, summary, delete, refresh. |
| `(tabs)/explore` | Activity dashboard — job filters, live session polling. |
| `(tabs)/profile` | Account, demo plan, runner target, API config, secure-session and biometric status. |
| `projects/[projectId]/files` | Searchable file tree; create, delete, open. |
| `projects/[projectId]/editor` | Touch-optimised code editor — edit, save, copy. |
| `projects/[projectId]/terminal` | The real terminal: queued sessions over the raw PTY WebSocket protocol, persistent interactive shell, visible working directory, live I/O, cancel, and a cloud-vs-desktop target indicator. |
| `projects/[projectId]/git` | Init, status, per-file diff, commit history, commit-all, origin config, push with live phase/percent, pull. |
| `settings/assistant` · `settings/server` | AI explanation settings (incl. GGUF model import) and API URL. |

### Client architecture

- **TanStack Query** (+ persist client) for all server state; `api/pocketdev.ts` is the
  single typed API surface, `api/axios.ts` the configured client. Long operations get raised
  timeouts — 120 s for file writes, 5 min for Git network operations.
- **`providers/AuthProvider.tsx`** owns auth; the JWT is persisted in `expo-secure-store`,
  and `expo-local-authentication` gates it behind Face ID / biometrics.
- **`hooks/useTerminalSession.ts`** owns the WebSocket PTY lifecycle — it is deliberately
  kept out of the route component.
- **`services/localAssistant.ts`** owns optional on-device inference.
- Shared design system in `components/ui/` (`Button`, `Card`, `Input`, `Badge`, `ListRow`,
  `Screen`, `StateView`, `AppHeader`, `OfflineBanner`) on the tokens in `constants/theme.ts`.
- `@react-native-community/netinfo` drives an offline banner; `react-hook-form` + `zod`
  handle forms; `zustand` holds the small amount of local UI state.

### Design tokens

Dark-first, cyan accent — deliberately an infra-tool register rather than a consumer one:

```
background #070A0F   surface  #0D1117   elevated #161B22   border #26303D
primary    #22D3EE   text     #F8FAFC   muted    #94A3B8   subtle #64748B
success    #22C55E   warning  #F59E0B   danger   #EF4444   info   #3B82F6
```

Semantic colours are wired to real meaning: green = running / online / exit 0, amber =
queued / dirty, red = failed / non-zero exit. Green is *not* the accent precisely because it
collides with "success". See [`docs/UI-UX.md`](./docs/UI-UX.md) for the full component
inventory and the terminal keyboard-accessory-bar design (a phone keyboard has no `Esc`,
`Tab`, `Ctrl` or arrows — a terminal is unusable without them).

---

## 12. Integrations and external services

| Integration | Where | What it does |
|---|---|---|
| **PostgreSQL 16** | `docker-compose.yml`, Prisma | Relational core. Local container for dev; managed instance in the production blueprint. |
| **Redis 7** | `docker-compose.yml`, BullMQ + ioredis | Job queue, priority scheduling, and two pub/sub channels for worker↔API coordination. |
| **Docker Engine** | `dockerode` in the worker | Provisioning, `exec`, teardown and orphan reaping of session sandboxes. |
| **gVisor (`runsc`)** | `EXECUTION_RUNTIME=runsc` | Syscall-interception sandbox layered under Docker. One env var; Linux/WSL2 only. |
| **OpenRouter** (default) | `server/src/assistant` | Server-side AI explanations via the OpenAI-compatible `/chat/completions` API. Default model `meta-llama/llama-3.3-70b-instruct`. |
| **Groq** (alternative) | same module | Zero-code fallback — set `GROQ_API_KEY` alone and the base URL/model default to `api.groq.com` + `llama-3.3-70b-versatile`. |
| **llama.rn + GGUF** | `mobile/services/localAssistant.ts` | Optional fully-offline on-device inference. The user imports a `.gguf` file via the document picker; it is copied into the app's documents directory and loaded with `initLlama`. |
| **Cloudflare Tunnel** (`cloudflared`) | desktop agent | Outbound-only tunnel exposing the desktop PTY gateway. `scripts/setup-named-tunnel.ps1` automates the named-tunnel setup on Windows. |
| **Tailscale / Headscale** | production blueprint | The documented production replacement for Cloudflare Tunnel. |
| **simple-git + a Git remote** | `server/src/git` | Real Git operations against the synced store. Push/pull to a real remote needs host credentials (HTTPS token or SSH key). |
| **Expo + EAS** | `mobile/`, `eas.json` | Development client, internal preview and production builds; `expo-updates` for OTA. |
| **Bull Board** | `/admin/queues` | Live queue dashboard behind basic auth — the visual proof of the freemium queue during a demo. |
| **Caddy** | production | Reverse proxy, automatic Let's Encrypt, WebSocket passthrough. |
| **Oracle Cloud Always Free ARM** | demo host | 2 OCPU / 12 GB ARM VM. Fallbacks: Hetzner, or Oracle pay-as-you-go. |
| **PM2 / systemd** | production | Keeps the API and worker alive across crashes and reboots. |

### The AI explanation path in detail

The mobile app **never receives the provider key**. It calls
`POST /assistant/explain-terminal` on its own authenticated backend, and the server holds
the credential. The request sends `{ command, exitCode?, output }`; the server sends a
`temperature: 0.2`, `max_tokens: 500` chat completion with the last 12 000 characters of
output wrapped in `<terminal_output>` tags, and a system prompt that explicitly instructs
the model to **treat terminal output as untrusted data, never as instructions** — terminal
output is attacker-influenceable and this is a prompt-injection boundary.

The on-device path (`llama.rn`) is the privacy opt-in: nothing leaves the phone, but the
user must supply their own quantised GGUF model file.

---

## 13. Security posture

What is actually enforced in the code today:

**Authentication.** JWT via Passport, bcryptjs password hashing, 7-day access tokens, a
global auth guard with explicit `@Public()` opt-outs. The API refuses to boot in production
with the default `JWT_SECRET`.

**PTY tokens.** Terminal sessions are not authorised by the access token. The API mints a
separate short-lived token (`scope: "pty"`, **5-minute TTL**) bound to
`{ sub, sessionId, projectId }`. The worker and desktop agent verify it with the shared
secret and check it against the session they were asked to attach to.

**Path traversal.** `FileStoreService.safeResolve()` normalises, then rejects anything
absolute, drive-qualified (`C:`), or containing `..` **before** resolving. There is a
Windows-specific reason for that ordering: `path.relative()` between different drives
returns the absolute target, which contains no `..` and would otherwise slip through. Every
project is confined to `${FILE_STORE_ROOT}/${userId}/${projectId}`. Covered by
`tests/path-traversal.test.ts`.

**Git isolation.** Git normally walks *up* to the nearest `.git`. During local development
the file store sits inside the PocketDev checkout, so every project would silently operate
on the wrong repository. `GitService` sets `GIT_CEILING_DIRECTORIES` to stop that upward
search at the store boundary.

**Container isolation.** All capabilities dropped then six added back, `no-new-privileges`,
memory/CPU/PID cgroup caps, tmpfs mounts, optional read-only rootfs, optional
`--network none`, and gVisor behind one env var. Documented honestly as *not sufficient for
untrusted multi-tenant code at scale* — that is what the microVM section of the build plan
is for.

**Blast-radius separation.** The process that runs untrusted code has no database
credentials and no database connection. It can only publish events onto a Redis channel.

**Desktop agent ownership binding.** Described in §10 — the check that stops one user's
valid token from opening a shell on another user's machine.

**Input validation.** Global `ValidationPipe` with `forbidNonWhitelisted: true` rejects
unknown fields rather than ignoring them.

**Prompt injection.** Terminal output sent to the AI provider is fenced and the system
prompt declares it untrusted data.

**Quotas.** `Subscription.quotaJobsPerDay` (default 50) enforced on a rolling 24-hour window
at job creation.

**Secrets hygiene.** `EXPO_PUBLIC_*` variables are embedded in the client bundle — the
mobile README says plainly that no secret may go there. The provider API key lives only in
`server/.env`.

---

## 14. Configuration reference

`.env.example` at the repo root documents everything in one place; copy the relevant blocks
into `server/.env` and `mobile/.env`.

### Server — `server/.env`

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | API port |
| `DATABASE_URL` | — | Postgres connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | `localhost` / `6379` / — | Redis |
| `JWT_SECRET` | — | Signs access **and** PTY tokens. Shared with the worker and desktop agent. Must be strong in production. |
| `JWT_EXPIRES_IN` | `7d` | Access-token lifetime |
| `FILE_STORE_ROOT` | `./.pocketdev-store` | Synced file store. Resolved from the repo root so the worker agrees. |
| `WORKER_WS_URL` | `ws://localhost:4100` | Public WS URL of the worker's PTY gateway, handed to the phone |
| `PTY_TOKEN_TTL` | `5m` | Per-session PTY token lifetime |
| `DESKTOP_HEARTBEAT_WINDOW_MS` | `30000` | Freshness window for "desktop is online" |
| `OPENROUTER_API_KEY` / `GROQ_API_KEY` / `AI_API_KEY` | — | AI provider credential (first non-empty wins) |
| `AI_BASE_URL` / `AI_MODEL` / `AI_TIMEOUT_MS` | OpenRouter defaults | Provider overrides |

### Execution worker

Shares `REDIS_*`, `JWT_SECRET` and `FILE_STORE_ROOT` with the server. Its own knobs:

| Variable | Default | Purpose |
|---|---|---|
| `WORKER_PTY_PORT` | `4100` | PTY gateway port |
| `WORKER_CONCURRENCY` | `2` | Max concurrent cloud sessions = the free-tier shared pool |
| `EXECUTION_IMAGE` | `node:22-bookworm-slim` | Base image |
| `EXECUTION_RUNTIME` | `runc` | `runsc` switches on gVisor |
| `EXECUTION_SHELL` | `bash` | Shell inside the container |
| `EXECUTION_MEMORY_MB` / `EXECUTION_CPUS` / `EXECUTION_PIDS_LIMIT` | `512` / `1` / `256` | Per-container caps |
| `EXECUTION_NETWORK` | `1` | `0` = `--network none` |
| `EXECUTION_READONLY` | `0` | `1` = read-only rootfs |
| `EXECUTION_USER` | image default | Container user for commands |
| `SESSION_CONNECT_TIMEOUT_S` / `SESSION_QUEUE_WAIT_S` / `SESSION_MAX_DURATION_S` | `60` / `300` / `1800` | Session timeouts |

### Desktop agent

| Variable | Default | Purpose |
|---|---|---|
| `DESKTOP_AGENT_PORT` / `DESKTOP_BIND` | `4000` / `127.0.0.1` | Local PTY gateway |
| `POCKETDEV_API_URL` / `POCKETDEV_TOKEN` | — | Where to heartbeat, and as whom |
| `POCKETDEV_TUNNEL_URL` | — | The public tunnel URL advertised to the API |
| `POCKETDEV_PROJECT` / `DESKTOP_PROJECT_ROOT` | — | Optional initial project↔folder link |
| `DESKTOP_SHELL` | `pwsh`/`cmd`/`bash` | Shell to spawn |
| `DESKTOP_NAME` / `DESKTOP_STATE_FILE` | — | Machine label; persisted project/folder map |
| `JWT_SECRET` | — | Must match the server's |

### Mobile — `mobile/.env`

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Initial API URL. iOS simulator `http://localhost:3000`; Android emulator `http://10.0.2.2:3000`; physical device `http://<LAN-IP>:3000`. A runtime value chosen on the connection screen overrides it. |

---

## 15. Running it

```bash
# 1. Install everything
pnpm install

# 2. Local Postgres + Redis
docker compose up -d

# 3. Configure env
cp .env.example server/.env        # then edit JWT_SECRET etc.
cp mobile/.env.example mobile/.env

# 4. Schema + two demo accounts
pnpm --filter @pocketdev/server db:migrate
pnpm --filter @pocketdev/server db:seed   # free@ / paid@pocketdev.dev · password123

# 5. Run (three terminals)
pnpm server:dev    # API + /admin/queues on :3000
pnpm worker:dev    # execution worker + PTY gateway on :4100  (needs Docker)
pnpm mobile:dev    # Expo / Metro
```

### End-to-end verification without the phone

```bash
# Auth → token
TOKEN=$(curl -s localhost:3000/auth/login -H 'content-type: application/json' \
  -d '{"email":"free@pocketdev.dev","password":"password123"}' | jq -r .accessToken)

# Seeded project id
PROJECT=$(curl -s localhost:3000/projects -H "authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Sync a local folder up (only changed files transfer)
POCKETDEV_TOKEN=$TOKEN pnpm --filter @pocketdev/cli-agent start sync ./some-folder -p $PROJECT

# Start a session — returns wsUrl + wsToken; connect with scripts/pty-client.mjs
curl -s localhost:3000/jobs -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d "{\"projectId\":\"$PROJECT\",\"command\":\"node -v\"}"
```

**Proving the freemium queue:** restart the worker with `WORKER_CONCURRENCY=1`, start a free
session, then start a second free one (it waits) and a paid one (it jumps). Watch it live at
`http://localhost:3000/admin/queues`.

**Desktop path:** run `pnpm --filter @pocketdev/desktop-agent start` with `POCKETDEV_TOKEN`
and `JWT_SECRET` set, expose port 4000 with `cloudflared`, and set `POCKETDEV_TUNNEL_URL` —
the API will route that user's sessions to the desktop instead of the cloud.

Full step-by-step, including Docker Desktop on Windows, named tunnels, the Oracle ARM deploy
and Caddy TLS, is in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

### Tests

`pnpm test` runs Vitest over ten suites in [`tests/`](./tests): assistant service, desktop
project control, desktop PTY proxy, file creation, git push progress, manifest hashing,
path traversal, PTY token handling, shell argument construction, terminal output parsing.

---

## 16. Status: built vs. blueprint

### Built and working

| Area | State |
|---|---|
| Auth / users / projects / billing / tiers | ✅ API complete |
| CLI delta-sync → server file store (JSONB manifest) | ✅ `services/cli-agent` + `/sync` gateway |
| File browse / read / write / delete API | ✅ `GET/PUT/DELETE /projects/:id/file(s)` |
| Terminal session start + tier-priority queue | ✅ `POST /jobs` → `StartSessionResponse` |
| Execution engine — hardened Docker + real PTY over WS | ✅ `services/execution-worker` + `packages/pty-core` |
| gVisor (`runsc`) hardening | ✅ one env var (`EXECUTION_RUNTIME=runsc`) |
| Local-desktop runtime + presence routing | ✅ `services/desktop-agent`, desktop-if-present-else-cloud |
| Git from the phone | ✅ `/projects/:id/git/*` via simple-git, incl. live push progress |
| Execution-status reconciliation (worker → Redis → DB) | ✅ `ExecutionReconciler`, worker never touches the DB |
| Queue dashboard | ✅ Bull Board at `/admin/queues` |
| Mobile app — auth, projects, files, editor, terminal, activity, git, settings | ✅ Expo / NativeWind client |
| AI explanations — server-side provider + optional on-device GGUF | ✅ `/assistant/explain-terminal` + `llama.rn` |

### Documented but deliberately not built

This is a college-project demo running 1–2 accounts on a single free-tier VM. Scale is
explicitly not a goal. The production blueprint — presented, not implemented — covers:

- Managed Postgres and Redis rather than local containers.
- A fleet of execution nodes with real orchestration.
- **microVM isolation** (Firecracker or Kata) instead of gVisor-over-Docker, which is the
  real answer for running untrusted code from strangers.
- Egress filtering on execution containers.
- Cost modelling per active session.
- Tailscale / Headscale replacing Cloudflare Tunnel.
- The security posture actual cloud IDE companies operate.

### Known constraints

- **Push/pull need host Git credentials.** The server runs Git against the file store; a
  real remote requires an HTTPS token or SSH key configured on the host. That is an
  environment concern the demo sets up rather than a feature.
- **One `JWT_SECRET` across all processes.** Convenient for a single-VM demo; it is exactly
  why the desktop agent has to bind PTY tokens to its own owner. Production would use
  asymmetric keys or per-service secrets.
- **Expo Go will not run this app** — custom native modules mean a development client is
  required.
- **gVisor is Linux/WSL2 only.**
