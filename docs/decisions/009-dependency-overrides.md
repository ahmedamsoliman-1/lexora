# ADR 009 — Dependency Overrides for Firebase Auth & Jose

**Status:** Accepted
**Date:** Post-Phase 7

## Context

During integration testing, a compatibility issue was discovered between
`firebase` (v12.16.0) and `firebase-admin` (v14.2.0) in the transitive
dependency chain for JWT verification:

1. `firebase-admin` depends on `jwks-rsa`, which depends on `jose`.
2. A newer version of `jose` (v5+) introduced breaking API changes that
   `jwks-rsa` in the resolved tree did not account for, causing runtime errors
   during ID token verification.
3. The `@firebase/auth` package version resolved by pnpm did not match the
   version expected by the `firebase` umbrella package, causing auth state
   synchronization issues.

## Decision

Pin transitive dependencies via `pnpm-workspace.yaml` overrides:

```yaml
overrides:
  "@firebase/auth": "1.13.3"
  "jwks-rsa>jose": "4.15.9"
```

Additionally, `firebase` was downgraded from `12.17.1` to `12.16.0` to match
the tested compatibility window.

## Rationale

- `jwks-rsa>jose` pins `jose` to v4.15.9 **only** within the `jwks-rsa`
  dependency subtree, avoiding the v5 breaking changes without affecting
  other packages that might legitimately require a newer `jose`.
- `@firebase/auth` v1.13.3 is the version known to work correctly with
  `firebase` v12.16.0's auth module.
- The `pnpm-workspace.yaml` file is the idiomatic place for pnpm overrides
  (equivalent to npm's `overrides` field in `package.json`).

## Consequences

- Any future `pnpm install` will respect these pins automatically.
- When upgrading `firebase` or `firebase-admin`, these overrides should be
  reviewed and removed if the upstream packages resolve the compatibility
  issue.
- The `allowBuilds` section in `pnpm-workspace.yaml` flags `@firebase/util`,
  `protobufjs`, and `unrs-resolver` as needing explicit build approval — these
  are pnpm's native build-script allowlist entries, not security decisions.

## Alternatives Considered

- **Upgrade `jwks-rsa`** — not directly controllable since it's a transitive
  dependency of `firebase-admin`.
- **Use npm instead of pnpm** — pnpm's `overrides` in `pnpm-workspace.yaml`
  provides the same capability with better monorepo support.
- **Patch the issue in application code** — fragile and would mask the root
  cause from anyone reading the lockfile.
