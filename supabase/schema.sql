-- ============================================================================
-- RetroCam Chat — Schema database completo (PostgreSQL / Supabase)
-- ----------------------------------------------------------------------------
-- Contiene:
--   1. Estensioni
--   2. Tabelle
--   3. Indici
--   4. Trigger updated_at + trigger profilo automatico
--   5. Funzioni helper di sicurezza
--   6. Row Level Security (RLS) + policy
--   7. Dati demo (stanze)
--
-- Esegui questo file una sola volta nell'SQL Editor di Supabase, oppure
-- tramite la Supabase CLI. È idempotente dove possibile (IF NOT EXISTS / DROP).
-- ============================================================================

-- ─────────────────────────────────────────────
-- 1. Estensioni
-- ─────────────────────────────────────────────
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ─────────────────────────────────────────────
-- 2. Tabelle
-- ─────────────────────────────────────────────

-- profiles -------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  status      text not null default 'online'
              check (status in ('online', 'busy', 'invisible')),
  is_invisible boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint username_len check (char_length(username) between 3 and 24)
);

-- rooms ----------------------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  topic       text,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- room_members ---------------------------------------------------------------
create table if not exists public.room_members (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid not null references public.rooms (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (room_id, user_id)
);

-- messages -------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete cascade,
  body         text not null,
  message_type text not null default 'text'
               check (message_type in ('text', 'system')),
  created_at   timestamptz not null default now(),
  constraint body_len check (char_length(body) <= 2000)
);

-- private_threads ------------------------------------------------------------
-- user_a è sempre l'id "più piccolo" per garantire unicità della coppia.
create table if not exists public.private_threads (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles (id) on delete cascade,
  user_b     uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint distinct_users check (user_a <> user_b),
  unique (user_a, user_b)
);

-- private_messages -----------------------------------------------------------
create table if not exists public.private_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.private_threads (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  constraint pm_body_len check (char_length(body) <= 2000)
);

-- blocked_users --------------------------------------------------------------
create table if not exists public.blocked_users (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint no_self_block check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

-- reports --------------------------------------------------------------------
create table if not exists public.reports (
  id                 uuid primary key default gen_random_uuid(),
  reporter_id        uuid not null references public.profiles (id) on delete cascade,
  reported_user_id   uuid references public.profiles (id) on delete cascade,
  message_id         uuid references public.messages (id) on delete cascade,
  private_message_id uuid references public.private_messages (id) on delete cascade,
  reason             text not null,
  created_at         timestamptz not null default now(),
  constraint reason_len check (char_length(reason) between 1 and 1000)
);

-- webcam_sessions ------------------------------------------------------------
create table if not exists public.webcam_sessions (
  id             uuid primary key default gen_random_uuid(),
  thread_id      uuid not null references public.private_threads (id) on delete cascade,
  broadcaster_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id      uuid not null references public.profiles (id) on delete cascade,
  audio_enabled  boolean not null default false,
  status         text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined', 'ended', 'cancelled')),
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  ended_at       timestamptz
);

-- webrtc_signals -------------------------------------------------------------
-- Tabella di "appoggio" per il signaling: i segnali vivono pochissimo.
create table if not exists public.webrtc_signals (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.webcam_sessions (id) on delete cascade,
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  signal_type  text not null check (signal_type in ('offer', 'answer', 'ice')),
  payload      jsonb not null,
  created_at   timestamptz not null default now()
);

-- moderation_events ----------------------------------------------------------
create table if not exists public.moderation_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. Indici
-- ─────────────────────────────────────────────
create index if not exists idx_messages_room_created   on public.messages (room_id, created_at desc);
create index if not exists idx_room_members_room        on public.room_members (room_id);
create index if not exists idx_room_members_user        on public.room_members (user_id);
create index if not exists idx_pm_thread_created        on public.private_messages (thread_id, created_at);
create index if not exists idx_threads_user_a           on public.private_threads (user_a);
create index if not exists idx_threads_user_b           on public.private_threads (user_b);
create index if not exists idx_blocked_blocker          on public.blocked_users (blocker_id);
create index if not exists idx_blocked_blocked          on public.blocked_users (blocked_id);
create index if not exists idx_signals_session          on public.webrtc_signals (session_id, created_at);
create index if not exists idx_signals_recipient        on public.webrtc_signals (recipient_id);
create index if not exists idx_webcam_thread            on public.webcam_sessions (thread_id, created_at desc);

-- ─────────────────────────────────────────────
-- 4. Trigger updated_at + profilo automatico
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea automaticamente una riga profiles vuota quando nasce un auth.user.
-- Lo username verrà impostato dal client in fase di ProfileSetup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    -- username provvisorio univoco; l'utente lo cambierà al primo accesso
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 5. Funzioni helper di sicurezza
-- ─────────────────────────────────────────────

-- Verifica se l'utente corrente partecipa a un thread privato.
create or replace function public.is_thread_participant(p_thread_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.private_threads t
    where t.id = p_thread_id
      and auth.uid() in (t.user_a, t.user_b)
  );
$$;

-- Verifica se p_target ha bloccato l'utente corrente
-- (cioè: l'utente corrente NON può scrivere a p_target).
create or replace function public.is_blocked_by(p_target uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocked_users b
    where b.blocker_id = p_target
      and b.blocked_id = auth.uid()
  );
$$;

-- Verifica partecipazione a una sessione webcam.
create or replace function public.is_session_party(p_session_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.webcam_sessions s
    where s.id = p_session_id
      and auth.uid() in (s.broadcaster_id, s.viewer_id)
  );
$$;

-- ─────────────────────────────────────────────
-- 6. Row Level Security + policy
-- ─────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.rooms             enable row level security;
alter table public.room_members      enable row level security;
alter table public.messages          enable row level security;
alter table public.private_threads   enable row level security;
alter table public.private_messages  enable row level security;
alter table public.blocked_users     enable row level security;
alter table public.reports           enable row level security;
alter table public.webcam_sessions   enable row level security;
alter table public.webrtc_signals    enable row level security;
alter table public.moderation_events enable row level security;

-- profiles: lettura pubblica (per mostrare nickname/avatar online),
-- ma ognuno modifica solo il proprio profilo.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- rooms: gli utenti possono leggere SOLO le stanze pubbliche.
drop policy if exists rooms_select_public on public.rooms;
create policy rooms_select_public on public.rooms
  for select using (is_public = true);

-- room_members: visibili a tutti gli autenticati (servono i conteggi/presence),
-- ma ognuno gestisce solo la propria membership.
drop policy if exists room_members_select on public.room_members;
create policy room_members_select on public.room_members
  for select using (auth.uid() is not null);

drop policy if exists room_members_insert on public.room_members;
create policy room_members_insert on public.room_members
  for insert with check (auth.uid() = user_id);

drop policy if exists room_members_update on public.room_members;
create policy room_members_update on public.room_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists room_members_delete on public.room_members;
create policy room_members_delete on public.room_members
  for delete using (auth.uid() = user_id);

-- messages: leggibili dagli autenticati (la stanza è pubblica);
-- scrivibili solo con il proprio user_id. I messaggi di sistema vengono
-- inseriti dal client (message_type='system') a nome dell'utente che entra/esce.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (auth.uid() is not null);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (auth.uid() = user_id);

-- private_threads: visibili/creabili solo dai due partecipanti.
drop policy if exists threads_select on public.private_threads;
create policy threads_select on public.private_threads
  for select using (auth.uid() in (user_a, user_b));

drop policy if exists threads_insert on public.private_threads;
create policy threads_insert on public.private_threads
  for insert with check (auth.uid() in (user_a, user_b));

-- private_messages: leggibili solo dai partecipanti al thread;
-- inviabili solo dal mittente, solo se non bloccato dall'altro utente.
drop policy if exists pm_select on public.private_messages;
create policy pm_select on public.private_messages
  for select using (public.is_thread_participant(thread_id));

drop policy if exists pm_insert on public.private_messages;
create policy pm_insert on public.private_messages
  for insert with check (
    auth.uid() = sender_id
    and public.is_thread_participant(thread_id)
    -- non posso scrivere all'altro membro del thread se mi ha bloccato
    and not exists (
      select 1
      from public.private_threads t
      join public.blocked_users b
        on b.blocker_id = case when t.user_a = sender_id then t.user_b else t.user_a end
      where t.id = thread_id
        and b.blocked_id = sender_id
    )
  );

-- aggiornare read_at del proprio thread (segnare come letto)
drop policy if exists pm_update on public.private_messages;
create policy pm_update on public.private_messages
  for update using (public.is_thread_participant(thread_id))
  with check (public.is_thread_participant(thread_id));

-- blocked_users: ognuno gestisce e vede solo i propri blocchi.
drop policy if exists blocks_select on public.blocked_users;
create policy blocks_select on public.blocked_users
  for select using (auth.uid() = blocker_id);

drop policy if exists blocks_insert on public.blocked_users;
create policy blocks_insert on public.blocked_users
  for insert with check (auth.uid() = blocker_id);

drop policy if exists blocks_delete on public.blocked_users;
create policy blocks_delete on public.blocked_users
  for delete using (auth.uid() = blocker_id);

-- reports: ognuno crea le proprie segnalazioni; lettura riservata allo staff
-- (service_role bypassa la RLS). Nessuna policy SELECT per utenti normali.
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert with check (auth.uid() = reporter_id);

-- webcam_sessions: visibili/gestibili solo dai due partecipanti.
-- Il broadcaster crea l'invito; non può invitare chi lo ha bloccato.
drop policy if exists webcam_select on public.webcam_sessions;
create policy webcam_select on public.webcam_sessions
  for select using (auth.uid() in (broadcaster_id, viewer_id));

drop policy if exists webcam_insert on public.webcam_sessions;
create policy webcam_insert on public.webcam_sessions
  for insert with check (
    auth.uid() = broadcaster_id
    and not public.is_blocked_by(viewer_id)
  );

drop policy if exists webcam_update on public.webcam_sessions;
create policy webcam_update on public.webcam_sessions
  for update using (auth.uid() in (broadcaster_id, viewer_id))
  with check (auth.uid() in (broadcaster_id, viewer_id));

-- webrtc_signals: leggibili solo da mittente o destinatario;
-- inviabili solo dal mittente che fa parte della sessione.
drop policy if exists signals_select on public.webrtc_signals;
create policy signals_select on public.webrtc_signals
  for select using (auth.uid() in (sender_id, recipient_id));

drop policy if exists signals_insert on public.webrtc_signals;
create policy signals_insert on public.webrtc_signals
  for insert with check (
    auth.uid() = sender_id
    and public.is_session_party(session_id)
    and not public.is_blocked_by(recipient_id)
  );

drop policy if exists signals_delete on public.webrtc_signals;
create policy signals_delete on public.webrtc_signals
  for delete using (auth.uid() in (sender_id, recipient_id));

-- moderation_events: ognuno registra solo i propri eventi (es. consenso webcam).
drop policy if exists modevents_insert on public.moderation_events;
create policy modevents_insert on public.moderation_events
  for insert with check (auth.uid() = user_id);

drop policy if exists modevents_select on public.moderation_events;
create policy modevents_select on public.moderation_events
  for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 6b. Realtime: pubblica le tabelle che il client ascolta
-- ─────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.private_messages;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.webcam_sessions;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.webrtc_signals;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.room_members;
  exception when duplicate_object then null; end;
end $$;

-- ─────────────────────────────────────────────
-- 7. Dati demo (stanze pubbliche)
-- ─────────────────────────────────────────────
insert into public.rooms (name, slug, description, topic, is_public) values
  ('Generale',   'generale',   'La piazza principale: presentati e chiacchiera di tutto.', 'Social',     true),
  ('Musica',     'musica',     'Consigli, ascolti del momento e scoperte musicali.',       'Musica',     true),
  ('Gaming',     'gaming',      'Console, PC, retro e nuove uscite.',                       'Videogiochi', true),
  ('Napoli',     'napoli',     'La stanza dedicata a Napoli e dintorni.',                  'Città',      true),
  ('Over 40',    'over-40',    'Spazio di confronto per chat over 40.',                    'Community',  true),
  ('Tecnologia', 'tecnologia', 'Gadget, software, AI e novità tech.',                      'Tech',       true)
on conflict (slug) do nothing;

-- ============================================================================
-- FINE schema RetroCam Chat
-- ============================================================================
