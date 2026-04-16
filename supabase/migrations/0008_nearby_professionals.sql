-- 0008 — nearby_professionals v2 (con cursor keyset pagination)

drop function if exists public.nearby_professionals(double precision, double precision, integer);

create or replace function public.nearby_professionals(
  p_user_lat double precision, p_user_lng double precision,
  p_radius_m integer default 10000, p_limit integer default 10,
  p_cursor_distance_m double precision default null, p_cursor_id uuid default null
)
returns table (
  id uuid, full_name text, category text, specialty text,
  sub_specialties text[], professional_area text[],
  description text, quote text, quote_author text,
  attends_online boolean, attends_presencial boolean,
  photo_url text, city text, distance_m double precision
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
      and st_dwithin(ul.geom, (select g from user_point)::geography, p_radius_m)
  )
  select id, full_name, category, specialty,
         sub_specialties, professional_area,
         description, quote, quote_author,
         attends_online, attends_presencial,
         photo_url, city, dist_m
  from candidates c
  where p_cursor_distance_m is null
     or c.dist_m > p_cursor_distance_m
     or (c.dist_m = p_cursor_distance_m and c.id > p_cursor_id)
  order by c.geom::geometry <-> (select g from user_point), c.id
  limit greatest(p_limit, 1);
$$;

grant execute on function public.nearby_professionals(
  double precision, double precision, integer, integer, double precision, uuid
) to authenticated;
