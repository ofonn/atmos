# 1. Record architecture decisions

Date: 2026-05-17
Status: Accepted

## Context

We need a lightweight way to capture *why* certain technical choices
were made (Supabase over Firebase, Open-Meteo over OpenWeather, last-
write-wins sync, etc.) so future contributors (and future Claude
sessions) don't re-litigate them or accidentally undo them.

## Decision

We will keep one numbered Markdown file per decision in
`docs/adr/NNNN-short-slug.md`, using the
[Michael Nygard format](https://github.com/joelparkerhenderson/architecture-decision-record):

- **Context** — why this came up
- **Decision** — what we chose
- **Consequences** — what becomes easier / harder

Each ADR is immutable once Accepted. Superseded ADRs are kept, with
a header pointing at the newer one.

## Consequences

- Cheap and self-evident — no extra tooling
- Easy to grep history of decisions
- New contributors can read the folder front-to-back in 30 minutes
