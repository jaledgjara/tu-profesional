-- =============================================================================
-- 0022_admin_user_moderation_rpcs.sql — RPCs de moderación de usuarios
-- =============================================================================
-- RPCs que el admin-web llama desde los botones "Suspender / Reactivar /
-- Eliminar / Restaurar" en las pantallas de clientes y profesionales.
-- Todas SECURITY DEFINER + guard is_admin() + razón obligatoria donde
-- corresponda + audit log.
--
-- Guardrails importantes (se repiten en cada RPC):
--   1. NO se puede suspender/eliminar a un admin. Protege contra un admin
--      que quiera joder a otro admin (o a sí mismo por error).
--   2. NO se puede suspender/eliminar al que ejecuta la acción (auth.uid()).
--   3. Razón obligatoria con min chars (10 para suspend, 20 para delete —
--      mismo patrón que 0019 con hide/delete de reviews: delete requiere
--      más barrera que suspend, que es reversible).
--
-- Además, este archivo reemplaza las RPCs de detalle (0020) para que
-- incluyan el estado de suspensión/eliminación. Y actualiza las RPCs de
-- listado (0018) para que el placeholder is_active refleje la realidad.
-- =============================================================================


-- =============================================================================
-- 1. admin_suspend_user(p_id uuid, p_reason text)
-- =============================================================================
-- Pone suspended_at = now() en el profile. Audit log. Devuelve void.
-- Error si: no es admin / target no existe / target es admin / target es
-- uno mismo / target ya está suspendido / target ya está borrado / razón
-- inválida.

CREATE OR REPLACE FUNCTION public.admin_suspend_user(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_role text;
  v_target_suspended_at timestamptz;
  v_target_deleted_at   timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot suspend yourself' USING errcode = '22023';
  END IF;

  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'suspension reason required (min 10 chars)' USING errcode = '22023';
  END IF;

  -- Lock de la fila: si otro admin corre en paralelo, el segundo espera.
  SELECT role, suspended_at, deleted_at
    INTO v_target_role, v_target_suspended_at, v_target_deleted_at
    FROM public.profiles
   WHERE id = p_id
   FOR UPDATE;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'user not found' USING errcode = 'P0002';
  END IF;

  IF v_target_role = 'admin' THEN
    RAISE EXCEPTION 'cannot suspend an admin' USING errcode = '42501';
  END IF;

  IF v_target_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'user is deleted' USING errcode = '22023';
  END IF;

  IF v_target_suspended_at IS NOT NULL THEN
    RAISE EXCEPTION 'user is already suspended' USING errcode = '22023';
  END IF;

  UPDATE public.profiles
     SET suspended_at      = now(),
         suspended_by      = auth.uid(),
         suspension_reason = btrim(p_reason)
   WHERE id = p_id;

  PERFORM public.log_admin_action(
    'suspend_user', 'profile', p_id::text,
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_suspend_user(uuid, text) TO authenticated;


-- =============================================================================
-- 2. admin_unsuspend_user(p_id uuid)
-- =============================================================================
-- Revierte suspensión. No pide razón (es reversible por naturaleza — nadie
-- reactiva "por error" con intención maliciosa, y si lo hiciera el audit
-- log queda).

CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  UPDATE public.profiles
     SET suspended_at      = NULL,
         suspended_by      = NULL,
         suspension_reason = NULL
   WHERE id = p_id
     AND suspended_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found or not suspended' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'unsuspend_user', 'profile', p_id::text, '{}'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unsuspend_user(uuid) TO authenticated;


-- =============================================================================
-- 3. admin_soft_delete_user(p_id uuid, p_reason text)
-- =============================================================================
-- Marca deleted_at. No borra la fila ni las reseñas asociadas. Un user
-- eliminado queda oculto de todas las queries (igual que suspendido) pero
-- conserva historia para auditoría.
--
-- Barrera más alta que suspend: razón ≥ 20 chars.
-- Reversible con admin_restore_user.

CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_role text;
  v_target_deleted_at timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete yourself' USING errcode = '22023';
  END IF;

  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 20 THEN
    RAISE EXCEPTION 'delete reason required (min 20 chars)' USING errcode = '22023';
  END IF;

  SELECT role, deleted_at
    INTO v_target_role, v_target_deleted_at
    FROM public.profiles
   WHERE id = p_id
   FOR UPDATE;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'user not found' USING errcode = 'P0002';
  END IF;

  IF v_target_role = 'admin' THEN
    RAISE EXCEPTION 'cannot delete an admin' USING errcode = '42501';
  END IF;

  IF v_target_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'user is already deleted' USING errcode = '22023';
  END IF;

  UPDATE public.profiles
     SET deleted_at = now(),
         deleted_by = auth.uid()
   WHERE id = p_id;

  PERFORM public.log_admin_action(
    'soft_delete_user', 'profile', p_id::text,
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid, text) TO authenticated;


-- =============================================================================
-- 4. admin_restore_user(p_id uuid)
-- =============================================================================
-- Revierte soft delete.

CREATE OR REPLACE FUNCTION public.admin_restore_user(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  UPDATE public.profiles
     SET deleted_at = NULL,
         deleted_by = NULL
   WHERE id = p_id
     AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found or not deleted' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'restore_user', 'profile', p_id::text, '{}'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_restore_user(uuid) TO authenticated;


-- =============================================================================
-- 5. admin_list_clients — devolver estado real de suspensión/delete
-- =============================================================================
-- Reemplaza la versión de 0018 donde is_active era placeholder. Sumamos
-- suspended_at y deleted_at al row para que el front pueda decidir qué
-- badge mostrar y qué acciones ofrecer en el dropdown (Suspender vs
-- Reactivar, etc).

CREATE OR REPLACE FUNCTION public.admin_list_clients(
  p_search text    DEFAULT NULL,
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
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

  SELECT count(*) INTO v_total
  FROM public.profiles p
  WHERE p.role = 'client'
    AND (v_needle IS NULL OR p.email ILIKE '%' || v_needle || '%');

  SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) INTO v_rows
  FROM (
    SELECT
      p.id,
      NULL::text   AS full_name,   -- clientes anónimos por decisión de producto
      p.email,
      NULL::text   AS phone,
      p.created_at,
      -- is_active: ahora refleja el estado real. Un user suspendido o
      -- borrado muestra is_active=false en el listado.
      (p.suspended_at IS NULL AND p.deleted_at IS NULL) AS is_active,
      p.suspended_at,
      p.deleted_at
    FROM public.profiles p
    WHERE p.role = 'client'
      AND (v_needle IS NULL OR p.email ILIKE '%' || v_needle || '%')
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT  greatest(p_limit, 1)
    OFFSET greatest(p_offset, 0)
  ) r;

  RETURN json_build_object('total', v_total, 'rows', v_rows);
END;
$$;


-- =============================================================================
-- 6. admin_list_professionals — idem, incluye estado de suspensión
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_professionals(
  p_status text    DEFAULT NULL,
  p_search text    DEFAULT NULL,
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_needle text;
  v_status public.professional_status;
  v_total  bigint;
  v_rows   json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  v_needle := nullif(btrim(coalesce(p_search, '')), '');

  IF p_status IS NOT NULL AND btrim(p_status) <> '' THEN
    BEGIN
      v_status := p_status::public.professional_status;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid status: %', p_status USING errcode = '22023';
    END;
  END IF;

  SELECT count(*) INTO v_total
  FROM public.professionals pr
  JOIN public.profiles p ON p.id = pr.id
  WHERE (v_status IS NULL OR pr.status = v_status)
    AND (
      v_needle IS NULL
      OR pr.full_name ILIKE '%' || v_needle || '%'
      OR p.email      ILIKE '%' || v_needle || '%'
      OR pr.license   ILIKE '%' || v_needle || '%'
      OR pr.specialty ILIKE '%' || v_needle || '%'
    );

  SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) INTO v_rows
  FROM (
    SELECT
      pr.id,
      pr.full_name,
      p.email,
      pr.photo_url,
      pr.license,
      pr.specialty,
      pr.professional_area,
      pr.status::text          AS status,
      -- is_active: ahora combina pr.is_active (toggle del dueño) con el
      -- estado de moderación del perfil (suspendido/borrado).
      (pr.is_active
        AND p.suspended_at IS NULL
        AND p.deleted_at   IS NULL) AS is_active,
      p.suspended_at,
      p.deleted_at,
      pr.created_at
    FROM public.professionals pr
    JOIN public.profiles p ON p.id = pr.id
    WHERE (v_status IS NULL OR pr.status = v_status)
      AND (
        v_needle IS NULL
        OR pr.full_name ILIKE '%' || v_needle || '%'
        OR p.email      ILIKE '%' || v_needle || '%'
        OR pr.license   ILIKE '%' || v_needle || '%'
        OR pr.specialty ILIKE '%' || v_needle || '%'
      )
    ORDER BY pr.created_at DESC, pr.id DESC
    LIMIT  greatest(p_limit, 1)
    OFFSET greatest(p_offset, 0)
  ) r;

  RETURN json_build_object('total', v_total, 'rows', v_rows);
END;
$$;


-- =============================================================================
-- 7. admin_get_client_by_id — agrega bloque "moderation" con suspension/delete
-- =============================================================================
-- Reemplaza la versión de 0020 para que el detail screen pueda renderizar
-- el banner "cuenta suspendida" y decidir qué botón mostrar.

CREATE OR REPLACE FUNCTION public.admin_get_client_by_id(p_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile    json;
  v_auth       json;
  v_moderation json;
  v_stats      json;
  v_reviews    json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  SELECT row_to_json(p) INTO v_profile
  FROM (
    SELECT id, email, role, created_at,
           suspended_at, suspension_reason,
           deleted_at
    FROM public.profiles
    WHERE id = p_id AND role = 'client'
  ) p;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(a) INTO v_auth
  FROM (
    SELECT last_sign_in_at
    FROM auth.users
    WHERE id = p_id
  ) a;

  -- Bloque moderation: email de quién suspendió/eliminó, fechas. Separado
  -- del profile para que el front tenga un único "¿el user está activo?"
  -- sin chequear campos de profile.
  SELECT row_to_json(m) INTO v_moderation
  FROM (
    SELECT
      p.suspended_at,
      p.suspended_by,
      sb.email          AS suspended_by_email,
      p.suspension_reason,
      p.deleted_at,
      p.deleted_by,
      db.email          AS deleted_by_email
    FROM public.profiles p
    LEFT JOIN public.profiles sb ON sb.id = p.suspended_by
    LEFT JOIN public.profiles db ON db.id = p.deleted_by
    WHERE p.id = p_id
  ) m;

  SELECT json_build_object(
    'total',      count(*),
    'visible',    count(*) FILTER (WHERE hidden_at IS NULL),
    'hidden',     count(*) FILTER (WHERE hidden_at IS NOT NULL),
    'avg_rating', coalesce(round(avg(rating)::numeric, 2), 0)
  ) INTO v_stats
  FROM public.reviews
  WHERE reviewer_id = p_id;

  SELECT coalesce(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO v_reviews
  FROM (
    SELECT
      r.id,
      r.professional_id,
      pr.full_name AS professional_name,
      pr.photo_url AS professional_photo_url,
      r.rating,
      r.comment,
      r.created_at,
      r.hidden_at,
      r.hidden_reason
    FROM public.reviews r
    LEFT JOIN public.professionals pr ON pr.id = r.professional_id
    WHERE r.reviewer_id = p_id
    ORDER BY r.created_at DESC
    LIMIT 20
  ) r;

  RETURN json_build_object(
    'profile',       v_profile,
    'auth',          coalesce(v_auth, json_build_object('last_sign_in_at', NULL)),
    'moderation',    v_moderation,
    'reviews_stats', v_stats,
    'reviews',       v_reviews
  );
END;
$$;


-- =============================================================================
-- 8. admin_get_professional_by_id — idem, suma bloque user_moderation
-- =============================================================================
-- El pro ya tenía un bloque "moderation" (de la aprobación). Ahora sumamos
-- "user_moderation" para suspensión/delete, así no los confundimos.

CREATE OR REPLACE FUNCTION public.admin_get_professional_by_id(p_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile         json;
  v_auth            json;
  v_professional    json;
  v_location        json;
  v_subscription    json;
  v_moderation      json;
  v_user_moderation json;
  v_stats           json;
  v_reviews         json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  SELECT row_to_json(p) INTO v_profile
  FROM (
    SELECT id, email, role, created_at,
           suspended_at, suspension_reason,
           deleted_at
    FROM public.profiles
    WHERE id = p_id AND role = 'professional'
  ) p;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(pr) INTO v_professional
  FROM (
    SELECT
      id, full_name, phone, dni, license, photo_url,
      category, specialty, sub_specialties, professional_area,
      description, quote, quote_author,
      attends_online, attends_presencial,
      is_active, status, created_at, updated_at,
      social_whatsapp, social_instagram, social_linkedin,
      social_twitter, social_tiktok
    FROM public.professionals
    WHERE id = p_id
  ) pr;

  SELECT row_to_json(l) INTO v_location
  FROM (
    SELECT street, number, floor, apartment, city, province, country, postal_code
    FROM public.user_locations
    WHERE user_id = p_id
  ) l;

  SELECT row_to_json(s) INTO v_subscription
  FROM (
    SELECT
      subscription_status    AS status,
      subscription_ends_at   AS ends_at,
      trial_ends_at,
      mp_preapproval_id
    FROM public.professionals
    WHERE id = p_id
  ) s;

  -- Moderation de aprobación (approve/reject) — ya existía en 0020.
  SELECT row_to_json(m) INTO v_moderation
  FROM (
    SELECT
      pr.reviewed_at,
      pr.reviewed_by,
      rb.email AS reviewed_by_email,
      pr.rejection_reason
    FROM public.professionals pr
    LEFT JOIN public.profiles rb ON rb.id = pr.reviewed_by
    WHERE pr.id = p_id
  ) m;

  -- User moderation (suspend/delete) — NUEVO.
  SELECT row_to_json(um) INTO v_user_moderation
  FROM (
    SELECT
      p.suspended_at,
      p.suspended_by,
      sb.email          AS suspended_by_email,
      p.suspension_reason,
      p.deleted_at,
      p.deleted_by,
      db.email          AS deleted_by_email
    FROM public.profiles p
    LEFT JOIN public.profiles sb ON sb.id = p.suspended_by
    LEFT JOIN public.profiles db ON db.id = p.deleted_by
    WHERE p.id = p_id
  ) um;

  SELECT row_to_json(a) INTO v_auth
  FROM (
    SELECT last_sign_in_at
    FROM auth.users
    WHERE id = p_id
  ) a;

  SELECT json_build_object(
    'total',      count(*),
    'visible',    count(*) FILTER (WHERE hidden_at IS NULL),
    'hidden',     count(*) FILTER (WHERE hidden_at IS NOT NULL),
    'avg_rating', coalesce(round(
                    avg(rating) FILTER (WHERE hidden_at IS NULL)::numeric, 2
                  ), 0),
    'rating_breakdown', json_build_object(
      '1', count(*) FILTER (WHERE hidden_at IS NULL AND rating = 1),
      '2', count(*) FILTER (WHERE hidden_at IS NULL AND rating = 2),
      '3', count(*) FILTER (WHERE hidden_at IS NULL AND rating = 3),
      '4', count(*) FILTER (WHERE hidden_at IS NULL AND rating = 4),
      '5', count(*) FILTER (WHERE hidden_at IS NULL AND rating = 5)
    )
  ) INTO v_stats
  FROM public.reviews
  WHERE professional_id = p_id;

  SELECT coalesce(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO v_reviews
  FROM (
    SELECT
      r.id,
      r.reviewer_id,
      rv.email AS reviewer_email,
      r.rating,
      r.comment,
      r.created_at,
      r.hidden_at,
      r.hidden_reason
    FROM public.reviews r
    LEFT JOIN public.profiles rv ON rv.id = r.reviewer_id
    WHERE r.professional_id = p_id
    ORDER BY r.created_at DESC
    LIMIT 20
  ) r;

  RETURN json_build_object(
    'profile',          v_profile,
    'auth',             coalesce(v_auth, json_build_object('last_sign_in_at', NULL)),
    'professional',     v_professional,
    'location',         v_location,
    'subscription',     v_subscription,
    'moderation',       v_moderation,
    'user_moderation',  v_user_moderation,
    'reviews_stats',    v_stats,
    'reviews',          v_reviews
  );
END;
$$;


-- =============================================================================
-- Fin de 0022_admin_user_moderation_rpcs.sql
-- =============================================================================
