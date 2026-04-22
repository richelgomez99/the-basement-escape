-- 1. Shared overrides document
create table if not exists public.puzzle_overrides (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.puzzle_overrides enable row level security;

create policy "Anyone can read puzzle overrides"
  on public.puzzle_overrides for select
  using (true);

create policy "Anyone can insert puzzle overrides"
  on public.puzzle_overrides for insert
  with check (true);

create policy "Anyone can update puzzle overrides"
  on public.puzzle_overrides for update
  using (true) with check (true);

-- seed the row so clients can always upsert by key
insert into public.puzzle_overrides (key, data) values ('global', '{}'::jsonb)
  on conflict (key) do nothing;

-- 2. Hidden-scenes image bucket
insert into storage.buckets (id, name, public)
  values ('hidden-scenes', 'hidden-scenes', true)
  on conflict (id) do nothing;

create policy "Hidden scenes are publicly readable"
  on storage.objects for select
  using (bucket_id = 'hidden-scenes');

create policy "Anyone can upload hidden scenes"
  on storage.objects for insert
  with check (bucket_id = 'hidden-scenes');

create policy "Anyone can update hidden scenes"
  on storage.objects for update
  using (bucket_id = 'hidden-scenes');