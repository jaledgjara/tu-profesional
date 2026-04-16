-- 0011 — get_professional_location (extrae lat/lng de geography)

create or replace function public.get_professional_location(p_professional_id uuid)
returns table (
  street text, number text, floor text, apartment text,
  postal_code text, city text, province text, country text,
  lat double precision, lng double precision
)
language sql stable security definer set search_path = public as $$
  select
    ul.street, ul.number, ul.floor, ul.apartment,
    ul.postal_code, ul.city, ul.province, ul.country,
    st_y(ul.geom::geometry) as lat,
    st_x(ul.geom::geometry) as lng
  from public.user_locations ul
  where ul.user_id = p_professional_id;
$$;

grant execute on function public.get_professional_location(uuid) to authenticated;
