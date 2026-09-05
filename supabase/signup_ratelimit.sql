-- Rate limiting for the public signup endpoint.
--
-- WHY: api/signup.js is a public endpoint that uses the service_role key to create
-- users. Without a durable rate limit it is an open account-creation faucet — an
-- in-memory counter does not work on serverless (each instance has its own memory
-- and it resets on cold start).
--
-- Only service_role touches this table (it bypasses RLS). RLS is enabled with no
-- policies so anon/authenticated clients can never read or write it.

create table if not exists public.signup_attempts (
  id         bigserial   primary key,
  email      text        not null,
  ip         text        not null,
  created_at timestamptz not null default now()
);

create index if not exists signup_attempts_email_idx
  on public.signup_attempts (lower(email), created_at desc);

create index if not exists signup_attempts_ip_idx
  on public.signup_attempts (ip, created_at desc);

alter table public.signup_attempts enable row level security;

-- Deliberately no policies: service_role only.

-- IP addresses are personal data — keep retention short. The endpoint calls this
-- opportunistically on each request.
create or replace function public.prune_signup_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.signup_attempts where created_at < now() - interval '24 hours';
$$;

revoke all on function public.prune_signup_attempts() from anon, authenticated;
