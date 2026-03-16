-- 识别结果临时表：供 /api/recognize 写入 token，前端 /record?token=xxx 读取后即删
create table if not exists public.pending_recognitions (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid() unique,
  result jsonb not null,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists pending_recognitions_token_idx on public.pending_recognitions (token);
create index if not exists pending_recognitions_expires_idx on public.pending_recognitions (expires_at);

-- 仅服务端用 service_role 访问，不开放 RLS 给 anon（本表由 API 读写）
