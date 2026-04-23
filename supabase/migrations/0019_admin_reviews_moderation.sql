-- =============================================================================
-- 0019_admin_reviews_moderation.sql — moderación de reseñas desde admin panel
-- =============================================================================
-- Agrega soft-hide a reviews + hard-delete con razón obligatoria, y RPC de
-- listado paginado para el admin.
--
-- Decisiones clave:
--   1. Soft-hide (hidden_at/hidden_by/hidden_reason) es el default. La reseña
--      queda invisible para usuarios finales (vista reviews_public la filtra)
--      pero el admin la sigue viendo y puede reactivarla. Reversible.
--   2. Hard-delete (admin_delete_review) queda como escape hatch para casos
--      severos (spam, doxxing, contenido ilegal). Razón obligatoria ≥20 chars
--      para subir la barrera vs hide (≥10 chars). Snapshot de la fila se
--      guarda en admin_audit_log.metadata para eventual restore manual.
--   3. Stats (get_professional_review_stats) filtran hidden_at IS NULL — el
--      rating visible del profesional no refleja reseñas ocultas.
-- =============================================================================


-- =============================================================================
-- 1. SCHEMA — columnas de soft-hide
-- =============================================================================

ALTER TABLE public.reviews
  ADD COLUMN hidden_at     timestamptz,
  ADD COLUMN hidden_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN hidden_reason text;

-- Index parcial para que los listados del admin ("ocultas" / "visibles")
-- sean rápidos sin indexar la columna completa cuando la gran mayoría de
-- filas son visibles (hidden_at IS NULL).
CREATE INDEX reviews_hidden_idx
  ON public.reviews (hidden_at DESC)
  WHERE hidden_at IS NOT NULL;


-- =============================================================================
-- 2. Actualizar reviews_public: excluir ocultas
-- =============================================================================
-- La vista pública no debería exponer reseñas que el admin marcó como
-- ocultas. `CREATE OR REPLACE VIEW` acepta la misma lista de columnas, así
-- que usamos ese camino (sin DROP) para no romper permisos.

CREATE OR REPLACE VIEW public.reviews_public
  WITH (security_invoker = false) AS
  SELECT id, professional_id, rating, comment, created_at
  FROM public.reviews
  WHERE hidden_at IS NULL;


-- =============================================================================
-- 3. Actualizar get_professional_review_stats: excluir ocultas
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_professional_review_stats(p_id uuid)
RETURNS TABLE (avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(round(avg(rating)::numeric, 2), 0)::numeric AS avg_rating,
    count(*)                                             AS review_count
  FROM public.reviews
  WHERE professional_id = p_id
    AND hidden_at IS NULL;
$$;


-- =============================================================================
-- 4. admin_list_reviews — listado paginado para moderación
-- =============================================================================
-- Filtros:
--   - p_status:       'visible' (hidden_at IS NULL) | 'hidden' | NULL/all
--   - p_rating:       filtro exacto por rating (1-5), NULL = todos
--   - p_professional: filtro por profesional específico (uuid), NULL = todos
--   - p_search:       ILIKE en comment
--
-- Retorno (json): { total, rows[] } con join a professional (nombre/foto) y
-- reviewer (email) más metadata de moderación (hidden_by_email).

CREATE OR REPLACE FUNCTION public.admin_list_reviews(
  p_status       text    DEFAULT NULL,
  p_rating       integer DEFAULT NULL,
  p_professional uuid    DEFAULT NULL,
  p_search       text    DEFAULT NULL,
  p_limit        integer DEFAULT 20,
  p_offset       integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_needle text;
  v_total  bigint;
  v_rows   json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  v_needle := nullif(btrim(coalesce(p_search, '')), '');

  -- Total
  SELECT count(*) INTO v_total
  FROM public.reviews r
  WHERE (
         p_status IS NULL OR p_status = 'all'
      OR (p_status = 'visible' AND r.hidden_at IS NULL)
      OR (p_status = 'hidden'  AND r.hidden_at IS NOT NULL)
    )
    AND (p_rating       IS NULL OR r.rating          = p_rating)
    AND (p_professional IS NULL OR r.professional_id = p_professional)
    AND (v_needle       IS NULL OR r.comment ILIKE '%' || v_needle || '%');

  -- Filas
  SELECT coalesce(json_agg(row_to_json(x)), '[]'::json) INTO v_rows
  FROM (
    SELECT
      r.id,
      r.professional_id,
      pr.full_name AS professional_name,
      pr.photo_url AS professional_photo_url,
      r.reviewer_id,
      p.email      AS reviewer_email,
      r.rating,
      r.comment,
      r.created_at,
      r.hidden_at,
      r.hidden_by,
      r.hidden_reason,
      hp.email     AS hidden_by_email
    FROM public.reviews r
    LEFT JOIN public.professionals pr ON pr.id = r.professional_id
    LEFT JOIN public.profiles       p  ON p.id  = r.reviewer_id
    LEFT JOIN public.profiles       hp ON hp.id = r.hidden_by
    WHERE (
           p_status IS NULL OR p_status = 'all'
        OR (p_status = 'visible' AND r.hidden_at IS NULL)
        OR (p_status = 'hidden'  AND r.hidden_at IS NOT NULL)
      )
      AND (p_rating       IS NULL OR r.rating          = p_rating)
      AND (p_professional IS NULL OR r.professional_id = p_professional)
      AND (v_needle       IS NULL OR r.comment ILIKE '%' || v_needle || '%')
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT  greatest(p_limit, 1)
    OFFSET greatest(p_offset, 0)
  ) x;

  RETURN json_build_object('total', v_total, 'rows', v_rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_reviews(text, integer, uuid, text, integer, integer)
  TO authenticated;


-- =============================================================================
-- 5. admin_hide_review — soft hide con razón obligatoria
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_hide_review(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'hide reason required (min 10 chars)' USING errcode = '22023';
  END IF;

  UPDATE public.reviews
     SET hidden_at     = now(),
         hidden_by     = auth.uid(),
         hidden_reason = btrim(p_reason)
   WHERE id = p_id
     AND hidden_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'review not found or already hidden' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'hide_review', 'review', p_id::text,
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_hide_review(uuid, text) TO authenticated;


-- =============================================================================
-- 6. admin_unhide_review — revertir hide
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_unhide_review(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  UPDATE public.reviews
     SET hidden_at     = NULL,
         hidden_by     = NULL,
         hidden_reason = NULL
   WHERE id = p_id
     AND hidden_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'review not found or not hidden' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'unhide_review', 'review', p_id::text, '{}'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unhide_review(uuid) TO authenticated;


-- =============================================================================
-- 7. admin_delete_review — hard delete con razón obligatoria y snapshot
-- =============================================================================
-- Barrera más alta que hide: razón ≥20 chars. La fila borrada se guarda
-- completa en admin_audit_log.metadata['snapshot'] para eventual restore
-- manual si fue un error.

CREATE OR REPLACE FUNCTION public.admin_delete_review(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 20 THEN
    RAISE EXCEPTION 'delete reason required (min 20 chars)' USING errcode = '22023';
  END IF;

  -- Snapshot antes de borrar
  SELECT to_jsonb(r) INTO v_snapshot
  FROM public.reviews r
  WHERE id = p_id;

  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'review not found' USING errcode = 'P0002';
  END IF;

  DELETE FROM public.reviews WHERE id = p_id;

  PERFORM public.log_admin_action(
    'delete_review', 'review', p_id::text,
    jsonb_build_object('reason', btrim(p_reason), 'snapshot', v_snapshot)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_review(uuid, text) TO authenticated;
