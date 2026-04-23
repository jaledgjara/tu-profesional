-- =============================================================================
-- 0020_admin_detail_rpcs.sql — RPCs de detalle por id para el admin panel
-- =============================================================================
-- Un RPC por tipo de usuario, devuelve todo lo necesario para pintar la página
-- de detalle en un solo round-trip. SECURITY DEFINER + guard is_admin().
--
-- Por qué un solo RPC en vez de varias queries desde el cliente:
--   1. auth.users.last_sign_in_at no es accesible con RLS normal — necesita
--      SECURITY DEFINER. Si lo movemos al cliente, tendríamos que hacer otra
--      RPC sólo para ese campo. Acá viene en el mismo payload.
--   2. Stats agregadas (count visibles/ocultas, avg rating) las hacemos server-
--      side en vez de pedir el set completo y reducir en el cliente.
--   3. Shape estable: el front consume un contrato json cerrado por RPC, sin
--      cuidar los múltiples joins ni sus FKs ambiguos.
--
-- Sprint A (este archivo): sólo lectura. Las acciones (suspender/forzar logout/
-- pausar suscripción) aterrizan en Sprint B/C con sus propias migraciones.
-- =============================================================================


-- =============================================================================
-- admin_get_client_by_id(p_id uuid)
-- =============================================================================
-- Retorno (json):
--   {
--     "profile": { id, email, role, created_at },
--     "auth":    { last_sign_in_at },
--     "reviews_stats": {
--       "total": N, "visible": M, "hidden": K, "avg_rating": 4.2
--     },
--     "reviews": [
--       { id, professional_id, professional_name, professional_photo_url,
--         rating, comment, created_at, hidden_at, hidden_reason }, ... (últimas 20)
--     ]
--   }
-- Si no existe un profile con ese id o su role != 'client', devuelve NULL.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_client_by_id(p_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile json;
  v_auth    json;
  v_stats   json;
  v_reviews json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  -- Profile base. Si el id no existe o no es client, devolvemos NULL (el
  -- front lo interpreta como 404). Mantenemos el filtro por role para que
  -- el endpoint no sirva accidentalmente un profesional o un admin.
  SELECT row_to_json(p) INTO v_profile
  FROM (
    SELECT id, email, role, created_at
    FROM public.profiles
    WHERE id = p_id AND role = 'client'
  ) p;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Datos de auth que no son accesibles vía RLS pero sí con SECURITY DEFINER.
  -- Usamos left join para no romper si el registro de auth.users fue borrado
  -- (caso borde de hard-delete manual).
  SELECT row_to_json(a) INTO v_auth
  FROM (
    SELECT last_sign_in_at
    FROM auth.users
    WHERE id = p_id
  ) a;

  -- Stats de reseñas escritas por este cliente. Separa total vs visible vs
  -- hidden para que el admin pueda ver "escribió 12 pero moderamos 3".
  SELECT json_build_object(
    'total',      count(*),
    'visible',    count(*) FILTER (WHERE hidden_at IS NULL),
    'hidden',     count(*) FILTER (WHERE hidden_at IS NOT NULL),
    'avg_rating', coalesce(round(avg(rating)::numeric, 2), 0)
  ) INTO v_stats
  FROM public.reviews
  WHERE reviewer_id = p_id;

  -- Últimas 20 reseñas escritas, con datos del profesional para que el
  -- admin pueda armarse un juicio sin tener que abrir 20 detalles.
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
    'reviews_stats', v_stats,
    'reviews',       v_reviews
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_client_by_id(uuid) TO authenticated;


-- =============================================================================
-- admin_get_professional_by_id(p_id uuid)
-- =============================================================================
-- Retorno (json):
--   {
--     "profile":       { id, email, role, created_at },
--     "auth":          { last_sign_in_at },
--     "professional":  { ...todos los campos de la tabla professionals... },
--     "location":      { street, number, floor, apartment, city, province, country, postal_code } | null,
--     "subscription":  { status, ends_at, trial_ends_at, mp_preapproval_id },
--     "moderation":    { reviewed_at, reviewed_by, reviewed_by_email, rejection_reason },
--     "reviews_stats": { total, visible, hidden, avg_rating, rating_breakdown: {1..5} },
--     "reviews":       [ últimas 20 recibidas con datos del reviewer ]
--   }
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_professional_by_id(p_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile      json;
  v_auth         json;
  v_professional json;
  v_location     json;
  v_subscription json;
  v_moderation   json;
  v_stats        json;
  v_reviews      json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  -- Profile. Filtramos por role='professional' para mantener simetría con
  -- el client RPC (no servir un cliente por este endpoint).
  SELECT row_to_json(p) INTO v_profile
  FROM (
    SELECT id, email, role, created_at
    FROM public.profiles
    WHERE id = p_id AND role = 'professional'
  ) p;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Datos del profesional. Si la fila no existe (onboarding a medio hacer)
  -- lo mantenemos explícito como NULL en vez de romper.
  SELECT row_to_json(pr) INTO v_professional
  FROM (
    SELECT
      id,
      full_name,
      phone,
      dni,
      license,
      photo_url,
      category,
      specialty,
      sub_specialties,
      professional_area,
      description,
      quote,
      quote_author,
      attends_online,
      attends_presencial,
      is_active,
      status,
      created_at,
      updated_at,
      social_whatsapp,
      social_instagram,
      social_linkedin,
      social_twitter,
      social_tiktok
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

  SELECT row_to_json(a) INTO v_auth
  FROM (
    SELECT last_sign_in_at
    FROM auth.users
    WHERE id = p_id
  ) a;

  -- Stats de reviews recibidas. rating_breakdown expone el histograma 1..5,
  -- útil para detectar "promedio 4 pero 40% son 1 estrella" — no se ve con
  -- el avg solo. Cuenta sólo reviews visibles (hidden_at IS NULL) para que
  -- coincida con lo que ve el usuario final en la app.
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

  -- Últimas 20 reviews recibidas (incluye ocultas; el admin debe verlas todas
  -- con la marca hidden_at para poder moderar desde acá).
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
    'profile',       v_profile,
    'auth',          coalesce(v_auth, json_build_object('last_sign_in_at', NULL)),
    'professional',  v_professional,
    'location',      v_location,
    'subscription',  v_subscription,
    'moderation',    v_moderation,
    'reviews_stats', v_stats,
    'reviews',       v_reviews
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_professional_by_id(uuid) TO authenticated;


-- =============================================================================
-- Fin de 0020_admin_detail_rpcs.sql
-- =============================================================================
