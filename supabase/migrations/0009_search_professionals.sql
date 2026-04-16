-- 0009 — search_professionals (tsvector + pg_trgm + area filter + cursor)

create or replace function public.search_professionals(
  p_query text, p_user_lat double precision, p_user_lng double precision,
  p_limit integer default 20,
  p_cursor_distance_m double precision default null,
  p_cursor_id uuid default null,
  p_area_filter text[] default null
)
returns table (
  id uuid, full_name text, category text, specialty text,
  sub_specialties text[], professional_area text[],
  description text, photo_url text, city text, distance_m double precision
)
language sql stable security definer set search_path = public as $$
  with
    nq  as (select public.immutable_unaccent(nullif(btrim(p_query), '')) as norm),
    tsq as (select case when (select norm from nq) is null then null
                        else plainto_tsquery('spanish', (select norm from nq)) end as ts),
    user_point as (
      select st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326) as g
    ),
    candidates as (
      select pr.*, ul.city, ul.geom,
             st_distance(ul.geom, (select g from user_point)::geography)::double precision as dist_m
      from public.professionals pr
      join public.user_locations ul on ul.user_id = pr.id
      where pr.is_active = true
        and (
          (select norm from nq) is null
          or pr.search_tsv @@ (select ts from tsq)
          or public.immutable_unaccent(pr.full_name)
               OPERATOR(extensions.%) (select norm from nq)
        )
        and (p_area_filter is null or pr.professional_area && p_area_filter)
    )
  select id, full_name, category, specialty,
         sub_specialties, professional_area,
         description, photo_url, city, dist_m
  from candidates c
  where p_cursor_distance_m is null
     or c.dist_m > p_cursor_distance_m
     or (c.dist_m = p_cursor_distance_m and c.id > p_cursor_id)
  order by c.geom::geometry <-> (select g from user_point), c.id
  limit greatest(p_limit, 1);
$$;

grant execute on function public.search_professionals(
  text, double precision, double precision, integer, double precision, uuid, text[]
) to authenticated;
