# ADR 002 — Use Firebase Authentication

**Status:** Accepted
**Date:** Phase 0

## Context

Lexora is multi-user at the data model level even though the initial target is
a single technical user. Every resource must belong to a Firebase user ID, and
backend operations must never trust a client-supplied user ID.

## Decision

Use **Firebase Authentication** with the Firebase Admin SDK for token
verification on the server.

Initial providers: email/password and Google.

## Rationale

- Strong BFF boundary: the browser authenticates with Firebase directly and
  sends a verifiable ID token to the BFF.
- Free tier covers the MVP.
- Admin SDK verification gives the server an authoritative UID without
  trusting the client.
- Provider set can grow (GitHub, Microsoft) without architectural changes.

## Consequences

- All `/api/*` route handlers that touch user data must verify the ID token
  and resolve the UID before calling services.
- Server-only Firebase Admin credentials live in `FIREBASE_*` environment
  variables and are never exposed to the browser.
- The client SDK config uses `NEXT_PUBLIC_FIREBASE_*` variables.

## Alternatives Considered

- NextAuth/Auth.js — workable, but the master plan specifies Firebase
  Authentication and the rest of the stack (no separate user store, verifiable
  ID tokens) aligns with Firebase.
- Custom JWT auth — unnecessary for the MVP and a security liability.
