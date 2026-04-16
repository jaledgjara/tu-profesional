-- 0010 — professionals_by_area + count_professionals_by_area

create or replace function public.professionals_by_area(
  p_area_slug text, p_user_lat double precision, p_user_lng double precision,
  p_limit integer default 20,
  p_cursor_distance_m double precision default null, p_cursor_id uuid default null
)
returns table (
  id uuid, full_name text, specialty text,
  sub_specialties text[], professional_area text[],
  description text, photo_url text, city text, distance_m double precision
)
language sql stable security definer set search_path = public as $$
  with user_point as (
    select st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326) as g
  ),
  candidates as (
    select pr.*, ul.city, ul.geom,
           st_distance(ul.geom, (select g from user_point)::geography)::double precision as dist_m
    from public.professionals pr
    join public.user_locations ul on ul.user_id = pr.id
    where pr.is_active = true
      and pr.professional_area && array[p_area_slug]::text[]
  )
  select id, full_name, specialty,
         sub_specialties, professional_area,
         description, photo_url, city, dist_m
  from candidates c
  where p_cursor_distance_m is null
     or c.dist_m > p_cursor_distance_m
     or (c.dist_m = p_cursor_distance_m and c.id > p_cursor_id)
  order by c.geom::geometry <-> (select g from user_point), c.id
  limit greatest(p_limit, 1);
$$;

create or replace function public.count_professionals_by_area()
returns table (area_slug text, n integer)
language sql stable security definer set search_path = public as $$
  select area_slug, count(*)::integer
  from (
    select unnest(pr.professional_area) as area_slug
    from public.professionals pr
    where pr.is_active = true
  ) s
  group by area_slug;
$$;

grant execute on function public.professionals_by_area(
  text, double precision, double precision, integer, double precision, uuid
) to authenticated;
grant execute on function public.count_professionals_by_area() to authenticated;
