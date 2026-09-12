create type public.user_role as enum ('admin', 'judge', 'secretariat', 'public');
create type public.competition_status as enum ('draft', 'live', 'published', 'archived');
create type public.routine_status as enum ('waiting', 'judging', 'scored', 'locked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'public',
  created_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  venue text not null default '',
  discipline text not null,
  status public.competition_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club text not null default '',
  country text not null default '',
  apparatus text not null default '',
  created_at timestamptz not null default now()
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  start_order integer not null,
  status public.routine_status not null default 'waiting',
  final_score numeric(6,2),
  unique (competition_id, participant_id),
  unique (competition_id, start_order)
);

create table public.competition_judges (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  panel text not null check (panel in ('db', 'da', 'artistry', 'execution')),
  primary key (competition_id, judge_id, panel)
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  judge_id uuid not null references public.profiles(id),
  panel text not null check (panel in ('db', 'da', 'artistry', 'execution')),
  payload jsonb not null default '{}'::jsonb,
  score numeric(6,2) not null default 0,
  validated_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (routine_id, judge_id, panel)
);

create or replace function public.is_role(required_role public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = required_role);
$$;

alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.participants enable row level security;
alter table public.routines enable row level security;
alter table public.competition_judges enable row level security;
alter table public.scores enable row level security;

create policy "profiles are visible to authenticated users" on public.profiles for select to authenticated using (true);
create policy "admins manage competitions" on public.competitions for all to authenticated using (public.is_role('admin')) with check (public.is_role('admin'));
create policy "published competitions are public" on public.competitions for select to anon using (status = 'published');
create policy "staff read routines" on public.routines for select to authenticated using (true);
create policy "admins manage routines" on public.routines for all to authenticated using (public.is_role('admin') or public.is_role('secretariat')) with check (public.is_role('admin') or public.is_role('secretariat'));
create policy "public read published participants" on public.participants for select to anon using (exists (select 1 from public.routines r join public.competitions c on c.id = r.competition_id where r.participant_id = participants.id and c.status = 'published'));
create policy "staff manage participants" on public.participants for all to authenticated using (public.is_role('admin') or public.is_role('secretariat')) with check (public.is_role('admin') or public.is_role('secretariat'));
create policy "assigned judges read scores" on public.scores for select to authenticated using (judge_id = auth.uid() or public.is_role('admin') or public.is_role('secretariat'));
create policy "assigned judges write scores" on public.scores for insert to authenticated with check (judge_id = auth.uid() and exists (select 1 from public.competition_judges cj where cj.judge_id = auth.uid()));
create policy "assigned judges update scores" on public.scores for update to authenticated using (judge_id = auth.uid() and validated_at is null) with check (judge_id = auth.uid());
