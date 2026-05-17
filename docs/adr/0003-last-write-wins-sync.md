# 3. Last-write-wins cloud sync, full-table replace

Date: 2026-05-17
Status: Accepted

## Context

We sync saved cities, chat history, and preferences between web and
Android for signed-in users. Two devices can edit the same row
concurrently — what happens?

Considered:
1. **Per-row CRDT** (e.g. Yjs, Automerge) — proper conflict-free
   merging
2. **Per-row timestamp** — server picks the newer write
3. **Last-write-wins, full-table replace** — every push deletes the
   user's rows in that table and re-inserts the local snapshot

## Decision

Pick **(3) last-write-wins, full-table replace** for the v1.

`pushAll()` runs every 30s on each signed-in client:
- `DELETE FROM <table> WHERE user_id = <me>`
- `INSERT` the entire local snapshot

`pullOnSignIn()` overwrites local storage with the server's snapshot
when a remote row exists, otherwise pushes local.

## Consequences

- **Easier:** trivial code. No conflict-resolution UI. No CRDT lib.
- **Risk:** if you edit settings on the web while offline, then edit
  on mobile, the mobile edit wins when the next push fires from
  whichever device was online last. Acceptable at our volume.
- **Performance:** a chat history of 200 messages is ~50 KB. The
  delete-then-insert costs one round trip per push; users
  typically idle 30s+ between actions, so this is fine.
- **Migration path:** if we ever need true per-row conflict resolution,
  add an `updated_at` column to each table and switch `pushAll` to
  per-row upsert with `where updated_at < excluded.updated_at`. The
  local snapshot already carries that info.
