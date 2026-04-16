-- 0012 — profile_views table + get_my_profile_views RPC

create table public.profile_views (
  id              uuid default gen_random_uuid() primary key,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  viewer_id       uuid references public.profiles(id) on delete set null,
  viewed_at       timestamptz default now() not null
);

create index profile_views_pro_month_idx
  on public.profile_views (professional_id, viewed_at desc);

alter table public.profile_views enable row level security;

create policy "Authenticated can insert views"
  on public.profile_views for insert
  to authenticated
  with check (true);

create policy "Professional reads own views"
  on public.profile_views for select
  to authenticated
  using (professional_id = auth.uid());

-- RPC para el dashboard del profesional
create or replace function public.get_my_profile_views()
returns table (this_month bigint, last_month bigint)
language sql stable security invoker set search_path = public as $$
  select
    count(*) filter (
      where viewed_at >= date_trunc('month', now())
    ) as this_month,
    count(*) filter (
      where viewed_at >= date_trunc('month', now()) - interval '1 month'
        and viewed_at < date_trunc('month', now())
    ) as last_month
  from public.profile_views
  where professional_id = auth.uid();
$$;

grant execute on function public.get_my_profile_views() to authenticated;
