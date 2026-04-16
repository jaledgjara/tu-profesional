-- 0007 — extensiones + tsvector (trigger) + índices para búsqueda

create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function public.immutable_unaccent(text)
returns text language sql immutable strict parallel safe as $$
  select extensions.unaccent($1)
$$;

alter table public.professionals drop column if exists search_tsv;
alter table public.professionals add column search_tsv tsvector;

create or replace function public.professionals_refresh_search_tsv()
returns trigger language plpgsql as $$
begin
  new.search_tsv := to_tsvector(
    'spanish',
    extensions.unaccent(
      coalesce(new.full_name, '')                              || ' ' ||
      coalesce(new.specialty, '')                              || ' ' ||
      coalesce(array_to_string(new.sub_specialties, ' '), '')  || ' ' ||
      coalesce(array_to_string(new.professional_area, ' '), '')
    )
  );
  return new;
end
$$;

drop trigger if exists professionals_search_tsv_tg on public.professionals;
create trigger professionals_search_tsv_tg
  before insert or update of full_name, specialty, sub_specialties, professional_area
  on public.professionals
  for each row execute function public.professionals_refresh_search_tsv();

update public.professionals set search_tsv = to_tsvector(
  'spanish',
  extensions.unaccent(
    coalesce(full_name, '')                              || ' ' ||
    coalesce(specialty, '')                              || ' ' ||
    coalesce(array_to_string(sub_specialties, ' '), '')  || ' ' ||
    coalesce(array_to_string(professional_area, ' '), '')
  )
);

create index if not exists professionals_search_tsv_gin_idx
  on public.professionals using gin (search_tsv);

create index if not exists professionals_full_name_trgm_idx
  on public.professionals using gin (public.immutable_unaccent(full_name) gin_trgm_ops);
