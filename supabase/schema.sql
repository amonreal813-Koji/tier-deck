-- ============================================================================
--  Tier Deck — community schema (v1: publish + browse + like)
--  Run this once in the Supabase dashboard → SQL Editor → New query → Run.
--  Safe to re-run: every statement is idempotent.
-- ============================================================================

-- 1. PROFILES — one public profile per signed-in user ------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Display names are unique (case-insensitive). See the index below.
create unique index if not exists profiles_display_name_unique
  on public.profiles (lower(display_name));

-- Auto-create a profile row the moment someone signs up (Google/Apple/email).
-- Names must be unique, so if two people share a name ("Alex Smith") we append
-- the smallest free number ("Alex Smith2") — signup must never fail on a clash.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text;
  candidate text;
  n int := 1;
begin
  base_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'ranker'), '@', 1)
  );
  candidate := base_name;
  while exists (select 1 from public.profiles where lower(display_name) = lower(candidate)) loop
    n := n + 1;
    candidate := base_name || n;
  end loop;
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, candidate, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PUBLISHED LISTS — a tier list shared to the community -------------------
create table if not exists public.published_lists (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  category   text,
  tagline    text,
  tiers      jsonb not null,           -- [{label,color,items:[{name,imageUrl,subtitle}]}]
  like_count int  not null default 0,  -- denormalized; kept in sync by trigger below
  created_at timestamptz not null default now()
);
create index if not exists published_lists_created_idx on public.published_lists (created_at desc);
create index if not exists published_lists_likes_idx   on public.published_lists (like_count desc);

-- 3. LIKES — one row per (user, list) ---------------------------------------
create table if not exists public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  list_id    uuid not null references public.published_lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

-- Keep published_lists.like_count accurate without re-counting every read.
create or replace function public.bump_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.published_lists set like_count = like_count + 1 where id = new.list_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.published_lists set like_count = greatest(0, like_count - 1) where id = old.list_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_trg on public.likes;
create trigger likes_count_trg
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

-- 4. REPORTS — lets users flag a published list for moderation ---------------
create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.published_lists(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason     text,
  created_at timestamptz not null default now()
);

-- 5. ROW LEVEL SECURITY ------------------------------------------------------
--  Everything is world-readable; users may only write their OWN rows. This is
--  what makes the public `anon` key safe to ship in the app.
alter table public.profiles        enable row level security;
alter table public.published_lists enable row level security;
alter table public.likes           enable row level security;
alter table public.reports         enable row level security;

drop policy if exists "profiles read"        on public.profiles;
drop policy if exists "profiles update own"  on public.profiles;
create policy "profiles read"       on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "lists read"        on public.published_lists;
drop policy if exists "lists insert own"  on public.published_lists;
drop policy if exists "lists update own"  on public.published_lists;
drop policy if exists "lists delete own"  on public.published_lists;
create policy "lists read"       on public.published_lists for select using (true);
create policy "lists insert own" on public.published_lists for insert with check (auth.uid() = author_id);
create policy "lists update own" on public.published_lists for update using (auth.uid() = author_id);
create policy "lists delete own" on public.published_lists for delete using (auth.uid() = author_id);

drop policy if exists "likes read"       on public.likes;
drop policy if exists "likes insert own" on public.likes;
drop policy if exists "likes delete own" on public.likes;
create policy "likes read"       on public.likes for select using (true);
create policy "likes insert own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes delete own" on public.likes for delete using (auth.uid() = user_id);

-- Anyone signed in can file a report; nobody can read them from the app (you
-- review reports in the Supabase dashboard). No select policy = no client reads.
drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert with check (auth.uid() = reporter_id);

-- 6. GRANTS — expose exactly these tables to the Data API, nothing else -------
--  Table grants and RLS are two separate layers: grants decide which tables the
--  API roles can touch at all, RLS decides which ROWS. We need both. Granting
--  explicitly here means Supabase's "automatically expose new tables" can stay
--  OFF, so a future table is never published to the API by accident.
grant usage on schema public to anon, authenticated;

grant select                 on public.profiles        to anon, authenticated;
grant update                 on public.profiles        to authenticated;

grant select                 on public.published_lists to anon, authenticated;
grant insert, update, delete on public.published_lists to authenticated;

grant select                 on public.likes           to anon, authenticated;
grant insert, delete         on public.likes           to authenticated;

-- Insert-only: users can file reports, but no one can read them via the API.
grant insert                 on public.reports         to authenticated;

-- Note: the like-counter and new-user triggers are SECURITY DEFINER, so they
-- can update published_lists / profiles regardless of the caller's grants.

-- Done. Next: enable Google/Apple providers under Authentication → Providers.
