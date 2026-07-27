-- Capivo — Datenbankschema für Login & Cloud-Projekte (Supabase / Postgres).
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Nutzerkonten selbst verwaltet Supabase Auth (auth.users) — hier steht nur, was Capivo speichert.

create table if not exists public.projects (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null default 'Untitled',
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

-- Row-Level-Security: ohne diese Policies kommt NIEMAND an die Daten (auch nicht mit dem
-- öffentlichen anon key). Jede Policy bindet den Zugriff an die eingeloggte Session.
alter table public.projects enable row level security;

create policy "own projects: read"   on public.projects for select using (auth.uid() = user_id);
create policy "own projects: insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "own projects: update" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own projects: delete" on public.projects for delete using (auth.uid() = user_id);
