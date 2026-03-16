-- SnapSpend: records table + RLS
-- Run this in Supabase SQL Editor after creating your project.

-- Table: records (one row per bookkeeping entry)
create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount <> 0),
  currency text not null default 'CNY',
  merchant text,
  category text,
  date date not null,
  note text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for listing by user and date
create index if not exists records_user_id_date_idx on public.records (user_id, date desc);

-- RLS: users can only read/write their own records
alter table public.records enable row level security;

create policy "Users can read own records"
  on public.records for select
  using (auth.uid() = user_id);

create policy "Users can insert own records"
  on public.records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on public.records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own records"
  on public.records for delete
  using (auth.uid() = user_id);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger records_updated_at
  before update on public.records
  for each row execute function public.set_updated_at();
