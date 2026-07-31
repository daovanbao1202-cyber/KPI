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
-- IMPORTANT: this app still reads most KPI tables directly from the browser
-- with the anon key. Enabling RLS with no policy blocks those reads and the
-- dashboard goes blank.
--
-- Pick the stance that matches your deployment:
--
--   (a) Internal network / trusted users — the current shape. Leave RLS off on
--       the KPI tables. The column-level REVOKE above still keeps password
--       hashes out of the browser, which is the critical part.
--
--   (b) Public internet — move the remaining Supabase reads in
--       src/context/KPIContext.tsx behind Route Handlers that use
--       SUPABASE_SERVICE_ROLE_KEY, then enable the deny-by-default policies
--       below. Until that refactor is done, turning these on will break the
--       dashboard.
--
-- Uncomment for stance (b):
--
-- alter table public.users            enable row level security;
-- alter table public.kpi_definitions  enable row level security;
-- alter table public.user_actuals     enable row level security;
-- alter table public.user_targets     enable row level security;
-- alter table public.dashboard_charts enable row level security;
-- alter table public.kpi_reports      enable row level security;
-- alter table public.app_settings     enable row level security;
-- alter table public.notifications    enable row level security;
--
-- With RLS enabled and no policies created, anon and authenticated are denied
-- everything while service_role continues to work.

-- -----------------------------------------------------------------------------
-- 5. One-time cleanup of legacy plaintext passwords
-- -----------------------------------------------------------------------------
-- The old schema had no password column, but if any plaintext value was ever
-- written into the table, clear it. Users are prompted to set a new password
-- at their next sign-in.
--
-- update public.users set password_hash = null
--  where password_hash is not null and password_hash not like 'scrypt$%';
