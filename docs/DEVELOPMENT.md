# PocketDev development guide

Start with the [root README](../README.md#try-it-locally). This guide covers the optional paths around that setup. Historical architecture rationale remains in the [build plan](../BUILD-PLAN.md).

## Local services and environment

`node scripts/prepare-local.mjs` creates missing `server/.env` and `mobile/.env`. It does not overwrite files, start Docker, install packages, migrate a database or configure signing.

The API and execution worker load shared configuration from `server/.env`. Real shell environment variables can override it. `FILE_STORE_ROOT` must resolve to the same location for the API and worker on a shared host. Keep `JWT_SECRET` and Redis settings consistent. Native package compilation may require a compiler toolchain.

The root Compose file starts Postgres on 5432 and Redis on 6379 with development credentials. Use a disposable local environment and check for port/container-name conflicts before starting. It does not provision a hosted IDE. Stopping your terminal processes is separate from stopping Compose; `docker compose stop` preserves the database volume.

## Import an existing project

After the API is running, authenticate using the local demo account or an account you create:

```bash
curl http://localhost:3000/auth/login -H "content-type: application/json" -d '{"email":"free@pocketdev.dev","password":"password123"}'
```

This example uses POSIX shell quoting. On Windows use an HTTP client or PowerShell's `Invoke-RestMethod` with a JSON body. Keep the returned token out of recordings and issue reports.

Use the authenticated `GET /projects` response or the mobile UI to select the project ID. Set `POCKETDEV_TOKEN` in the CLI process environment, then:

```bash
pnpm --filter @pocketdev/cli-agent start sync ./sample-project -p YOUR_PROJECT_ID
```

Use a disposable sample repository first. See the [CLI guide](../services/cli-agent/README.md) for its available options.

## Desktop execution

The [desktop agent](../services/desktop-agent/README.md) supplies a host PTY gateway, folder linking and a presence heartbeat. It shares the API's JWT configuration. It also needs an authenticated `POCKETDEV_TOKEN` and the API address.

```bash
pnpm desktop:dev
```

A remote phone needs a reachable, authenticated tunnel or other approved network path to that gateway. Setting a tunnel URL does not create the tunnel or grant access to a private LAN. Check the desktop guide for the current Cloudflare setup. Desktop commands run with the host's permissions.

The cloud worker is a separate path. A synced file store and available worker are prerequisites for running a project when the original desktop is offline. Dependencies or host-specific paths do not automatically transfer with source files.

## AI explanations

Set an OpenAI-compatible provider on the backend using the variables documented in the root `.env.example`. OpenRouter and Groq configuration are supported paths. Keep provider keys on the backend; never put them in `EXPO_PUBLIC_*` variables. Provider credentials, availability and billing are your responsibility.

Optional on-device explanations use an imported compatible GGUF model through `llama.rn`. A native development client, model download, memory and platform compatibility are required. Model weights are not bundled. Local explanations are distinct from remote command execution.

## Mobile networking and builds

Follow the [mobile guide](../mobile/README.md). A physical phone's `localhost` is the phone, not the server. Both the API URL and PTY WebSocket URL must be reachable from the client. Remote deployments should use HTTPS/WSS.

Use your own EAS project and Apple/Android signing setup. Existing checked-in project identifiers do not provide access to another account's build service. Expo Go cannot load all of this application's native modules.

## Verification

Available root commands:

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Some per-workspace scripts remain scaffold/no-op checks. Report the actual command, scope and result rather than calling a no-op a test pass. For docs-only changes check links and source-backed command names.

An end-to-end smoke should independently demonstrate login, a disposable project sync, an edit saved to the intended runtime, a terminal command with live output, cancellation and Git status/diff. Record which runtime was used. A desktop recording is not evidence that cloud execution or gVisor worked.

No end-to-end run, deployment, mobile build or gVisor verification is claimed by these documentation changes.
