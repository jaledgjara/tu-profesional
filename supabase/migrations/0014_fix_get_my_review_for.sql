-- =============================================================================
-- 0014_fix_get_my_review_for.sql — fix phantom-row bug en get_my_review_for
-- =============================================================================
-- Bug: la RPC estaba declarada `returns public.reviews` (composite). Cuando el
-- select interno no matcheaba ninguna fila, PostgreSQL devolvía una fila
-- sintetizada con todos los campos en NULL en vez de cero filas. El cliente
-- interpretaba esa fila fantasma como "el usuario ya reseñó" y mostraba
-- "Gracias por colaborar" aun cuando no había reseña real.
--
-- Fix: cambiar el tipo de retorno a `setof public.reviews` — 0 matches →
-- conjunto vacío (array [] en PostgREST), 1 match → array con 1 elemento.
--
-- Nota: drop + create en vez de `create or replace` porque cambiar el tipo
-- de retorno requiere recrear la función.
-- =============================================================================

drop function if exists public.get_my_review_for(uuid);

create function public.get_my_review_for(p_id uuid)
returns setof public.reviews
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
