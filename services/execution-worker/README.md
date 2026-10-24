# Execution worker

The worker consumes terminal jobs from BullMQ, starts Docker-backed sessions and streams interactive PTY traffic through `@pocketdev/pty-core`. It publishes execution lifecycle events through Redis. The API reconciles those events into PostgreSQL; the worker does not access the application database.

## Run

Follow the [root setup](../../README.md#try-it-locally) first, including the shared-package build. Start the API and worker separately:

```bash
pnpm worker:dev
```

Configuration loads from the shared `server/.env`; real shell environment values take precedence. Keep `JWT_SECRET`, Redis configuration and `FILE_STORE_ROOT` aligned with the API. The default PTY port is 4100; `WORKER_WS_URL` is the address the API gives to the mobile client, so it must be reachable from that client.

`node-pty` is a dependency of the shared PTY package. A native compilation toolchain may be required during installation.

## Docker runtime

`EXECUTION_RUNTIME` defaults to `runc`. Selecting `runsc` requires gVisor installation and Docker runtime registration on the host. The worker also exposes memory, CPU, PID, network and session-duration settings; see the root `.env.example` and `src/config.ts`. Defaults are development settings, not a claim of secure multi-tenant hosting.

See `src/docker.ts` for container configuration and the shared PTY package for streaming behavior.
