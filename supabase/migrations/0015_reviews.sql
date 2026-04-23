-- =============================================================================
-- 0015_reviews.sql — Reseñas anónimas de profesionales
-- =============================================================================
-- Feature: cualquier client autenticado puede dejar 1 reseña (rating 1-5 +
-- comment opcional ≤ 1000 chars) por profesional. Las reseñas se leen
-- ANÓNIMAS a través de reviews_public (vista sin reviewer_id).
--
-- Defensa en profundidad para anonimato:
--   1. reviews_public proyecta SIN reviewer_id
--   2. RLS en tabla base reviews — SELECT directo solo al autor/admin
--   3. GRANT acotado por capa
-- =============================================================================

-- 1) Tabla base
create table public.reviews (
  id              uuid        not null default gen_random_uuid() primary key,
  professional_id uuid        not null references public.professionals(id) on delete cascade,
  reviewer_id     uuid        not null references public.profiles(id)      on delete cascade,
  rating          integer     not null,
  comment         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint reviews_unique_pair    unique (professional_id, reviewer_id),
  constraint reviews_rating_range   check (rating between 1 and 5),
  constraint reviews_comment_len    check (comment is null or char_length(comment) <= 1000),
  constraint reviews_no_self_review check (professional_id <> reviewer_id)
);

-- 2) Índices
create index reviews_professional_created_idx
  on public.reviews (professional_id, created_at desc);

create index reviews_reviewer_idx
  on public.reviews (reviewer_id);

-- 3) Trigger updated_at (helper de 0001_init_auth)
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- 4) RLS
alter table public.reviews enable row level security;

create policy "reviews_select_own_or_admin"
  on public.reviews for select to authenticated
  using (reviewer_id = auth.uid() or public.is_admin());

create policy "reviews_insert_client_only"
  on public.reviews for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
  );

create policy "reviews_update_own"
  on public.reviews for update to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

create policy "reviews_delete_own_or_admin"
  on public.reviews for delete to authenticated
  using (reviewer_id = auth.uid() or public.is_admin());

-- 5) Vista pública anónima (SIN reviewer_id)
create view public.reviews_public
  with (security_invoker = false) as
  select id, professional_id, rating, comment, created_at
  from public.reviews;

grant select on public.reviews_public to authenticated, anon;

-- 6) RPC: stats agregados
create or replace function public.get_professional_review_stats(p_id uuid)
returns table (avg_rating numeric, review_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(round(avg(rating)::numeric, 2), 0)::numeric as avg_rating,
    count(*)                                             as review_count
  from public.reviews
  where professional_id = p_id;
$$;

grant execute on function public.get_professional_review_stats(uuid)
  to authenticated, anon;

-- 7) RPC: mi reseña para un profesional (RLS auto-filtra)
create or replace function public.get_my_review_for(p_id uuid)
returns public.reviews
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.reviews
  where professional_id = p_id
    and reviewer_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_review_for(uuid) to authenticated;
