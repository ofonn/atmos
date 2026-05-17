-- 0012 — saved_locations.tag for quick-switch between Home / Work / etc.
-- Soft enum so we can add more labels later without a migration.
-- A user can have at most one row per tag.

alter table public.saved_locations
  add column if not exists tag text;

create unique index if not exists saved_locations_one_tag_per_user
  on public.saved_locations(user_id, tag)
  where tag is not null;
