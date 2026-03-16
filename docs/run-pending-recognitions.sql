-- 复制整段到 Supabase SQL Editor 执行（用于「通过图片记账」的 token 预填）

create table if not exists public.pending_recognitions (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid() unique,
  result jsonb not null,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists pending_recognitions_token_idx on public.pending_recognitions (token);
create index if not exists pending_recognitions_expires_idx on public.pending_recognitions (expires_at);
