-- =============================================================================
-- 0001_init_auth.sql
-- =============================================================================
-- Schema inicial: profiles + professionals + user_locations
-- - Passwordless OTP via Supabase Auth (no toca este SQL, se configura en Dashboard)
-- - Diferenciación cliente/profesional con role enum
-- - Ubicación en tabla aparte con PostGIS para FILTRAR por cercanía
-- - RLS estricto, lectura cruzada vía RPCs SECURITY DEFINER
-- =============================================================================

-- Extensiones --------------------------------------------------------------
create extension if not exists postgis;

-- Helper: trigger que mantiene updated_at -----------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLA: profiles
-- 1:1 con auth.users. Fuente de verdad del rol.
-- =============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('client', 'professional')),
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLA: professionals
-- 1:1 con profiles donde role='professional'. Datos pesados del pro.
-- =============================================================================
create table if not exists public.professionals (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  category            text not null default 'psychology',
  dni                 text,
  license             text,
  description         text,
  quote               text,
  quote_author        text,
  specialty           text,
  sub_specialties     text[] default '{}',
  attends_online      boolean not null default false,
  attends_presencial  boolean not null default false,
  photo_url           text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger professionals_set_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

create index if not exists professionals_is_active_idx
  on public.professionals (is_active)
  where is_active = true;

-- =============================================================================
-- TABLA: user_locations
-- Una sola ubicación por usuario (UNIQUE implícito por PK).
-- geom es geography(Point, 4326): se usa para FILTRAR (no calcular distancias).
-- =============================================================================
create table if not exists public.user_locations (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  street       text not null,
  number       text not null,
  floor        text,
  apartment    text,
  postal_code  text,
  city         text,
  province     text default 'Mendoza',
  country      text default 'Argentina',
  geom         geography(Point, 4326) not null,
  updated_at   timestamptz not null default now()
);

create trigger user_locations_set_updated_at
  before update on public.user_locations
  for each row execute function public.set_updated_at();

-- Índice GiST para consultas espaciales (ST_DWithin, etc.)
create index if not exists user_locations_geom_idx
  on public.user_locations
  using gist (geom);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- profiles -----------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- professionals ------------------------------------------------------------
alter table public.professionals enable row level security;

-- Lectura pública de pros activos (la app cliente lista pros)
create policy "professionals_select_public"
  on public.professionals for select
  using (is_active = true or auth.uid() = id);

create policy "professionals_insert_own"
  on public.professionals for insert
  with check (auth.uid() = id);

create policy "professionals_update_own"
  on public.professionals for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_locations -----------------------------------------------------------
-- Sólo el dueño puede leer/escribir su fila. La lectura cruzada para
-- filtros por cercanía se hace exclusivamente vía RPC SECURITY DEFINER.
alter table public.user_locations enable row level security;

create policy "user_locations_select_own"
  on public.user_locations for select
  using (auth.uid() = user_id);

create policy "user_locations_insert_own"
  on public.user_locations for insert
  with check (auth.uid() = user_id);

create policy "user_locations_update_own"
  on public.user_locations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_locations_delete_own"
  on public.user_locations for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- RPC: upsert_user_location
-- Encapsula la construcción del geography(Point) para no exponerlo al cliente.
-- =============================================================================
create or replace function public.upsert_user_location(
  p_lat         double precision,
  p_lng         double precision,
  p_street      text,
  p_number      text,
  p_floor       text default null,
  p_apartment   text default null,
  p_postal_code text default null,
  p_city        text default null,
  p_province    text default 'Mendoza',
  p_country     text default 'Argentina'
)
returns public.user_locations
language plpgsql
security invoker  -- respeta RLS: el usuario sólo puede tocar su propia fila
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.user_locations;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_locations as ul (
    user_id, street, number, floor, apartment, postal_code,
    city, province, country, geom
  )
  values (
    v_uid, p_street, p_number, p_floor, p_apartment, p_postal_code,
    p_city, p_province, p_country,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  )
  on conflict (user_id) do update set
    street      = excluded.street,
    number      = excluded.number,
    floor       = excluded.floor,
    apartment   = excluded.apartment,
    postal_code = excluded.postal_code,
    city        = excluded.city,
    province    = excluded.province,
    country     = excluded.country,
    geom        = excluded.geom,
    updated_at  = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.upsert_user_location(
  double precision, double precision, text, text, text, text, text, text, text, text
) to authenticated;

-- =============================================================================
-- RPC: nearby_professionals
-- Filtra (no calcula distancias para mostrar) profesionales activos dentro
-- de un radio en metros desde un punto dado. SECURITY DEFINER para poder
-- leer user_locations de los pros sin romper RLS.
-- =============================================================================
create or replace function public.nearby_professionals(
  user_lat  double precision,
  user_lng  double precision,
  radius_m  integer default 10000
)
returns table (
  id                 uuid,
  full_name          text,
  category           text,
  specialty          text,
  sub_specialties    text[],
  description        text,
  quote              text,
  quote_author       text,
  attends_online     boolean,
  attends_presencial boolean,
  photo_url          text,
  city               text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    pr.category,
    pr.specialty,
    pr.sub_specialties,
    pr.description,
    pr.quote,
    pr.quote_author,
    pr.attends_online,
    pr.attends_presencial,
    pr.photo_url,
    ul.city
  from public.professionals pr
  join public.profiles p       on p.id = pr.id
  join public.user_locations ul on ul.user_id = pr.id
  where pr.is_active = true
    and ST_DWithin(
          ul.geom,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
          radius_m
        );
$$;

grant execute on function public.nearby_professionals(
  double precision, double precision, integer
) to authenticated, anon;
