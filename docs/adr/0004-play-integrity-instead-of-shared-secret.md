# 4. Play Integrity over shared-secret for mobile API auth

Date: 2026-05-17
Status: Accepted

## Context

The web app calls `/api/*` from the same origin. The Android app
needs to call the same endpoints over the public internet. We need
to prevent attackers from extracting an API key and scraping our
Gemini quota.

Options:
1. **Shared secret in the APK** — trivial to extract via decompile.
2. **OAuth client secret** — same problem; it lives in the binary.
3. **Per-user JWT** — only works after the user signs in; we want
   anonymous weather lookups too.
4. **Google Play Integrity API** — Google signs a short-lived token
   attesting that the APK is genuine, Play-distributed, running on
   an unmodified device.

## Decision

Use **Play Integrity** as the always-on gate for `/api/*`. Adding
Supabase auth on top is additive: signed-in routes additionally
check `auth.uid()`.

Implementation:
- `mobile/lib/api/play_integrity_interceptor.dart` attaches a fresh
  token (Classic API) to every outbound request.
- `src/lib/playIntegrity.ts` decodes via Google's API, validates
  package name + timestamp + verdicts.
- Same-origin browser requests skip the check (header
  `sec-fetch-site=same-origin`).

## Consequences

- **Hardest case (sideloaded debug APK):** verdict `UNRECOGNIZED_VERSION`;
  with `PLAY_INTEGRITY_STRICTNESS=strict` we 401, with `lenient`
  (current default during pre-launch) we let it through.
- **No secret in the APK** — token is bound to package + device + time.
- **One extra round-trip on cold start** to Google. Negligible vs.
  Gemini latency.
- **Tied to Google Play distribution.** If we ever ship a non-Play
  build (F-Droid, side-loaded enterprise) we'd need to swap to
  per-user JWT for those builds.
