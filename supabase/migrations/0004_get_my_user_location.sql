-- =============================================================================
-- Migración: get_my_user_location
-- =============================================================================
-- Expone la ubicación del usuario autenticado con lat/lng ya extraídos de la
-- columna `geom` (geography). Se usa en la vista "Mi portafolio" para pintar
-- un mapa real centrado en la dirección del profesional.
--
-- Por qué una RPC y no un select directo:
--   - `geom` es geography(Point, 4326). Leerlo como WKT en supabase-js complica
--     el parsing y acopla el cliente al schema PostGIS.
--   - Centralizamos la proyección snake_case → campos + lat/lng en una sola
--     función estable, con `security invoker` para que RLS siga protegiendo.
-- =============================================================================

create or replace function public.get_my_user_location()
returns table (
  user_id     uuid,
  street      text,
  number      text,
  floor       text,
  apartment   text,
  postal_code text,
  city        text,
  province    text,
  country     text,
  lat         double precision,
  lng         double precision
)
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  return query
  select
    ul.user_id,
    ul.street,
    ul.number,
    ul.floor,
    ul.apartment,
    ul.postal_code,
    ul.city,
    ul.province,
    ul.country,
    ST_Y(ul.geom::geometry)::double precision as lat,
    ST_X(ul.geom::geometry)::double precision as lng
  from public.user_locations ul
  where ul.user_id = v_uid;
end;
$$;

grant execute on function public.get_my_user_location() to authenticated;
