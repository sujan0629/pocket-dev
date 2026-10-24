# Contributing to PocketDev

PocketDev is a working prototype. Small fixes to setup, terminal behavior, sync, mobile usability and documentation are useful. Open an issue describing the problem before starting a substantial feature.

## Start here

1. Follow the [README setup](README.md#try-it-locally) and [mobile guide](mobile/README.md).
2. Pick a focused change and explain the behavior before and after it.
3. Run checks relevant to your change. Root commands include `pnpm test`, `pnpm typecheck` and `pnpm lint`. Some workspace commands still contain scaffold/no-op checks; report exactly what ran.
4. Include reproduction steps and hardware/runtime constraints. For UI work, add a screenshot or recording using a disposable sample project.

For documentation-only work, check links, commands and claims against the current source. Do not present a planned runtime, benchmark or deployment as completed.

## Useful issue reports

Include OS, Node/pnpm versions, client type, selected runtime (desktop/cloud), steps, expected result and actual result. Redact credentials, JWTs, tunnel URLs, personal paths and private repository details. Never attach `.env`, signing material, GGUF weights or third-party code you cannot redistribute.

## Review scope

Explain API/protocol changes and compatibility implications. Keep unrelated dependency upgrades or formatting out of focused fixes. Contributions touching execution permissions, path handling, process lifecycle or authentication need a clear failure-case explanation.

## License status

There is no top-level project license yet. Do not add an MIT/Apache badge or relicense existing work without maintainer agreement and a review of contributor and third-party rights.
