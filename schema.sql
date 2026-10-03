-- CaptionRush — Datenbankschema für Login & Cloud-Projekte (Supabase / Postgres).
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Nutzerkonten selbst verwaltet Supabase Auth (auth.users) — hier steht nur, was CaptionRush speichert.

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

-- Hinweis: Eigene Caption-Templates eines Nutzers liegen als EINE reservierte Zeile in dieser Tabelle
-- (title = '__capivo_templates__', payload = { kind: 'capivo_templates', templates: [...] }).
-- Kein eigenes Schema nötig — die RLS-Policies oben schützen sie wie jedes Projekt; das Frontend
-- blendet sie in der Projektliste aus.

-- ── Beta-E-Mail-Gate: Leads (Download ohne Wasserzeichen gegen E-Mail) ──
-- Das Frontend schreibt per REST (publishable key, Rolle anon) NUR per INSERT. Es gibt bewusst keine
-- SELECT/UPDATE/DELETE-Policy: niemand kann die Liste über die API lesen — Export nur im Dashboard
-- (Table Editor → leads → Export CSV) bzw. mit dem service_role-Key serverseitig.
-- newsletter = true nur bei aktivem Opt-in; consent_text hält den angezeigten Einwilligungstext fest.
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  email        text not null check (char_length(email) between 3 and 254 and position('@' in email) > 1),
  newsletter   boolean not null default false,
  consent_text text check (char_length(consent_text) <= 300),
  source       text check (char_length(source) <= 40),
  lang         text check (char_length(lang) <= 20),
  created_at   timestamptz not null default now()
);
alter table public.leads enable row level security;
drop policy if exists "leads: insert only" on public.leads;
create policy "leads: insert only" on public.leads for insert to anon, authenticated with check (true);
grant insert on public.leads to anon, authenticated;
create index if not exists leads_email_idx on public.leads (lower(email));
