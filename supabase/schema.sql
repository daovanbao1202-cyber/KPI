-- =============================================================================
-- KPI App — Supabase setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Every statement is idempotent, so it is safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Credential storage
-- -----------------------------------------------------------------------------
-- Passwords are stored as scrypt hashes in the format `scrypt$<salt>$<hash>`.
-- They are written and read only by server-side code (src/lib/server-users.ts).
alter table public.users
  add column if not exists password_hash text;

-- Prevent browser clients from ever reading the hash. Postgres supports
-- column-level privileges, so the rest of the row stays readable.
-- The service_role key used by the server bypasses this.
--
-- ORDER MATTERS. A column-level revoke makes `select *` fail for the entire
-- row, so run these four statements only AFTER deploying a build whose client
-- lists user columns explicitly (src/context/KPIContext.tsx). Running them
-- against an older deployment blanks the user list.
--
-- Undo with:
--   grant select (password_hash) on public.users to anon;
revoke select (password_hash) on public.users from anon;
revoke select (password_hash) on public.users from authenticated;
revoke update (password_hash) on public.users from anon;
revoke update (password_hash) on public.users from authenticated;

-- -----------------------------------------------------------------------------
-- 2. Application settings (MBO columns and other shared UI state)
-- -----------------------------------------------------------------------------
create table if not exists public.app_settings (
  id text primary key,
  custom_columns jsonb,
  hidden_cols jsonb,
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 2b. KPI reports
-- -----------------------------------------------------------------------------
-- The Data page derives each Actual from the number of completed reports, so
-- this table holds real measurements, not just attachments. It was missing for
-- a long time while the client swallowed the resulting write errors, which is
-- why Actual columns read 0 even though reports existed locally.
create table if not exists public.kpi_reports (
  id text primary key,
  kpi_id text,
  user_id bigint,
  date_key text,
  month text,
  customer text,
  type text,
  report_name text,
  pic_id bigint,
  url text,
  status text,
  date text,
  note text,
  is_done boolean not null default false
);

create index if not exists kpi_reports_lookup_idx
  on public.kpi_reports (kpi_id, user_id, date_key);

-- -----------------------------------------------------------------------------
-- 2c. Saved dashboard charts
-- -----------------------------------------------------------------------------
create table if not exists public.dashboard_charts (
  id text primary key,
  type text,
  kpi_id text,
  kpi_ids jsonb,
  title text,
  date_range jsonb
);

-- -----------------------------------------------------------------------------
-- 3. Notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------
-- Every database query now runs server-side through /api/data, /api/auth/* and
-- /api/notifications, each behind a session check. The browser no longer holds
-- a database key, so RLS can deny anon outright.
--
-- PREREQUISITES — check both before running this section:
--
--   1. SUPABASE_SERVICE_ROLE_KEY on Vercel is a valid `service_role` key.
--      Without it the server falls back to the anon key, and these policies
--      would lock the application out of its own database.
--      Verify: sign in as an Admin and open /api/diagnostics on the deployed
--      site. Proceed only when it reports "readyForRls": true.
--
--   2. The deployment includes the server-side data layer (src/lib/kpi-store.ts).
--      An older build talks to Supabase from the browser and will go blank.
--
-- With RLS enabled and no policies created, anon and authenticated are denied
-- everything while service_role continues to work.
--
-- Undo with: alter table <name> disable row level security;

alter table public.users            enable row level security;
alter table public.kpi_definitions  enable row level security;
alter table public.user_actuals     enable row level security;
alter table public.user_targets     enable row level security;
alter table public.dashboard_charts enable row level security;
alter table public.kpi_reports      enable row level security;
alter table public.app_settings     enable row level security;
alter table public.notifications    enable row level security;

-- -----------------------------------------------------------------------------
-- 5. One-time cleanup of legacy plaintext passwords
-- -----------------------------------------------------------------------------
-- The old schema had no password column, but if any plaintext value was ever
-- written into the table, clear it. Users are prompted to set a new password
-- at their next sign-in.
--
-- update public.users set password_hash = null
--  where password_hash is not null and password_hash not like 'scrypt$%';
