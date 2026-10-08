-- CaptionRush — Datenbankschema für Login, Cloud-Projekte und Leads (Supabase / Postgres).
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausführen — und nach jedem Update dieser Datei erneut:
-- alles ist idempotent (kann beliebig oft laufen) und löscht NIE Daten.
-- Nutzerkonten selbst verwaltet Supabase Auth (auth.users) — hier steht nur, was CaptionRush speichert.

-- ── Cloud-Projekte ──
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

drop policy if exists "own projects: read"   on public.projects;
drop policy if exists "own projects: insert" on public.projects;
drop policy if exists "own projects: update" on public.projects;
drop policy if exists "own projects: delete" on public.projects;
create policy "own projects: read"   on public.projects for select using (auth.uid() = user_id);
create policy "own projects: insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "own projects: update" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own projects: delete" on public.projects for delete using (auth.uid() = user_id);

-- Explizite Rechte (Supabase vergibt sie für neue Tabellen nicht mehr automatisch; für Projekte ab
-- 30.5.2026 bzw. neue Tabellen ab 30.10.2026 Pflicht). Nur eingeloggte Nutzer, nie anon.
revoke all on public.projects from anon;
grant select, insert, update, delete on public.projects to authenticated;

-- Hinweis: Eigene Caption-Templates eines Nutzers liegen als EINE reservierte Zeile in dieser Tabelle
-- (title = '__capivo_templates__', payload = { kind: 'capivo_templates', templates: [...] }).
-- Kein eigenes Schema nötig — die RLS-Policies oben schützen sie wie jedes Projekt; das Frontend
-- blendet sie in der Projektliste aus.

-- ── Leads (E-Mail für den Download, optional Newsletter mit Double-Opt-in) ──
-- Geschrieben wird NUR serverseitig von lead.php/confirm.php mit dem service_role-Key (der nur in der
-- config.php auf dem Server liegt). anon/authenticated haben KEINEN Zugriff: niemand kann die Liste über
-- die öffentliche API lesen, fremde Adressen eintragen oder Einwilligungen selbst bestätigen.
-- Export: Dashboard → Table Editor → leads → Export CSV.
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  email        text not null check (char_length(email) between 3 and 254 and position('@' in email) > 1),
  newsletter   boolean not null default false,   -- hat das Häkchen gesetzt
  consent_text text check (char_length(consent_text) <= 300),
  source       text check (char_length(source) <= 40),
  lang         text check (char_length(lang) <= 20),
  created_at   timestamptz not null default now()
);
-- Double-Opt-in: Newsletter darf nur an Zeilen mit confirmed_at gehen. Der Token liegt nur gehasht in der DB.
alter table public.leads add column if not exists confirm_hash  text;
alter table public.leads add column if not exists confirm_sent  timestamptz;
alter table public.leads add column if not exists confirmed_at  timestamptz;
alter table public.leads add column if not exists confirmed_ip  text;      -- nur gekürzt/gehasht, als Nachweis
alter table public.leads add column if not exists unsubscribed_at timestamptz;

alter table public.leads enable row level security;
drop policy if exists "leads: insert only" on public.leads;   -- alte, offene Policy: weg
revoke all on public.leads from anon, authenticated;
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_confirm_hash_idx on public.leads (confirm_hash) where confirm_hash is not null;

-- ── Fehlerüberwachung (log.php) und anonyme Style-Zählung (stat.php) ──
-- Beide Tabellen sind für anon/authenticated gesperrt; geschrieben wird nur serverseitig mit dem service_role-Key.
-- Keine Personendaten: client_errors enthält bereinigten Fehlertext, Seitenpfad und Browser-Familie, keine IP.
create table if not exists public.client_errors (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  msg        text not null check (char_length(msg) <= 240),
  src        text check (char_length(src) <= 120),
  page       text check (char_length(page) <= 80),
  browser    text check (char_length(browser) <= 30)
);
alter table public.client_errors enable row level security;
revoke all on public.client_errors from anon, authenticated;
create index if not exists client_errors_created_idx on public.client_errors (created_at desc);
-- Auswertung: select * from public.error_summary;   (letzte 7 Tage, häufigste zuerst)
create or replace view public.error_summary as
  select msg, src, count(*) as n, max(created_at) as last_seen, array_agg(distinct browser) as browsers
  from public.client_errors where created_at > now() - interval '7 days'
  group by msg, src order by n desc;
revoke all on public.error_summary from anon, authenticated;

create table if not exists public.style_stats (
  day   date not null,
  style text not null check (style ~ '^[a-z0-9_-]{1,32}$'),
  n     integer not null default 0,
  primary key (day, style)
);
alter table public.style_stats enable row level security;
revoke all on public.style_stats from anon, authenticated;
create or replace function public.bump_style(p_style text) returns void
language sql security definer set search_path = public as $$
  insert into public.style_stats (day, style, n) values (current_date, p_style, 1)
  on conflict (day, style) do update set n = public.style_stats.n + 1
$$;
revoke all on function public.bump_style(text) from public, anon, authenticated;
grant execute on function public.bump_style(text) to service_role;

-- ── Abo-Vorbereitung (noch nicht scharf: config.php BILLING_ENABLED=false) ──
-- profiles: Plan pro Nutzer (geschrieben nur vom Webhook mit service_role); usage: Sekunden Ton pro Tag und Nutzer;
-- paddle_events: bereits verarbeitete Webhook-Events (Idempotenz). Nutzer dürfen nur ihre eigene Zeile lesen.
create table if not exists public.profiles (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free', 'creator', 'pro')),
  status                 text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'paused', 'canceled')),
  period_end             timestamptz,
  paddle_customer_id     text,
  paddle_subscription_id text,
  last_event_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select to authenticated using (user_id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create index if not exists profiles_customer_idx on public.profiles (paddle_customer_id) where paddle_customer_id is not null;

create table if not exists public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  seconds integer not null default 0 check (seconds >= 0),
  primary key (user_id, day)
);
alter table public.usage enable row level security;
drop policy if exists "usage: read own" on public.usage;
create policy "usage: read own" on public.usage for select to authenticated using (user_id = auth.uid());
revoke all on public.usage from anon, authenticated;
grant select on public.usage to authenticated;

create table if not exists public.paddle_events (
  event_id    text primary key check (char_length(event_id) <= 80),
  type        text not null,
  received_at timestamptz not null default now()
);
alter table public.paddle_events enable row level security;
revoke all on public.paddle_events from anon, authenticated;

create or replace function public.add_usage(p_user uuid, p_seconds integer) returns void
language sql security definer set search_path = public as $$
  insert into public.usage (user_id, day, seconds) values (p_user, current_date, greatest(p_seconds, 0))
  on conflict (user_id, day) do update set seconds = public.usage.seconds + greatest(p_seconds, 0)
$$;
revoke all on function public.add_usage(uuid, integer) from public, anon, authenticated;
grant execute on function public.add_usage(uuid, integer) to service_role;

-- Jeder neue Nutzer bekommt eine Free-Zeile; bestehende werden einmalig nachgetragen.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles (user_id) select id from auth.users on conflict (user_id) do nothing;

-- ── Keep-alive ──
-- Supabase pausiert Gratisprojekte nach ~7 Tagen ohne Aktivität. Der tägliche GitHub-Workflow ruft diese
-- Funktion auf (zählt als Datenbank-Aktivität, gibt nichts Sensibles zurück).
create or replace function public.ping() returns text
language sql security definer set search_path = public as $$ select 'ok'::text $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;

-- ── Konto löschen (DSGVO Art. 17 / nDSG Art. 32) ──
-- Eingeloggte Nutzer können ihr Konto selbst löschen; die Projekte verschwinden per on delete cascade.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
