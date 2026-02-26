-- Security hardening: enable RLS + remove direct anon/authenticated access
-- Context: Supabase linter flagged public tables without RLS.
-- Tables: users, books, payments, email_captures, content_reports, purchases, matchup_popularity

begin;

-- 1) Enable RLS on all flagged public tables
alter table if exists public.users enable row level security;
alter table if exists public.books enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.email_captures enable row level security;
alter table if exists public.content_reports enable row level security;
alter table if exists public.purchases enable row level security;
alter table if exists public.matchup_popularity enable row level security;

-- 2) Remove direct table grants from API roles used by client JWTs
-- (service_role still works server-side and bypasses RLS)
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.books from anon, authenticated;
revoke all privileges on table public.payments from anon, authenticated;
revoke all privileges on table public.email_captures from anon, authenticated;
revoke all privileges on table public.content_reports from anon, authenticated;
revoke all privileges on table public.purchases from anon, authenticated;
revoke all privileges on table public.matchup_popularity from anon, authenticated;

commit;

-- Verification queries (run manually after migration)
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname='public'
--   and tablename in ('users','books','payments','email_captures','content_reports','purchases','matchup_popularity')
-- order by tablename;
--
-- select table_name, privilege_type, grantee
-- from information_schema.role_table_grants
-- where table_schema='public'
--   and table_name in ('users','books','payments','email_captures','content_reports','purchases','matchup_popularity')
--   and grantee in ('anon','authenticated')
-- order by table_name, grantee, privilege_type;
