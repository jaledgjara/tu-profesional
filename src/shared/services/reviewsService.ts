// Service: reviewsService
// Capa: shared/services (función pura, sin React, sin estado)
//
// Conecta el cliente con la feature de reseñas. Divide responsabilidades:
//   - LECTURA pública: vista `reviews_public` (sin reviewer_id, anonimato)
//   - LECTURA privada: RPC `get_my_review_for` (RLS filtra por auth.uid)
//   - STATS: RPC `get_professional_review_stats` (SECURITY DEFINER, avg + count)
//   - ESCRITURA: INSERT/UPDATE/DELETE sobre tabla base, RLS hace el resto
//
// Tipos derivados de Database (regenerado desde el remoto en 0013_reviews.sql).

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/shared/services/supabase";
import type {
  Review,
  ReviewStats,
  MyReview,
  CreateReviewInput,
  UpdateReviewInput,
} from "@/features/reviews/types";
import type { Database } from "@/shared/types/database";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS derivados de database.ts
// ─────────────────────────────────────────────────────────────────────────────

type DbTables    = Database["public"]["Tables"];
type DbFunctions = Database["public"]["Functions"];

type ReviewsPublicRow = Database["public"]["Views"]["reviews_public"]["Row"];
type ReviewRow        = DbTables["reviews"]["Row"];
type StatsRow         = DbFunctions["get_professional_review_stats"]["Returns"][number];

type TypedClient = SupabaseClient<Database>;

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS (privados) — snake_case DB → camelCase cliente
// ─────────────────────────────────────────────────────────────────────────────

// reviews_public tiene columnas nullable por la proyección de la vista,
// pero en la práctica id/professional_id/rating/created_at nunca son null.
// Forzamos el narrow para que la UI no tenga que chequear.
function mapPublicRow(row: ReviewsPublicRow): Review {
  return {
    id:             row.id!,
    professionalId: row.professional_id!,
    rating:         row.rating!,
    comment:        row.comment,
    createdAt:      row.created_at!,
  };
}

function mapMyReviewRow(row: ReviewRow): MyReview {
  return {
    id:             row.id,
    professionalId: row.professional_id,
    reviewerId:     row.reviewer_id,
    rating:         row.rating,
    comment:        row.comment,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — lista pública anónima (perfil + pantalla "todas las reseñas")
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchReviewsOptions {
  limit?:  number;  // default 20
  offset?: number;  // default 0
}

export async function fetchProfessionalReviews(
  professionalId: string,
  options: FetchReviewsOptions = {},
  client: TypedClient = supabase,
): Promise<Review[]> {
  const limit  = options.limit ?? 20;
  const offset = options.offset ?? 0;

  console.log("[reviews] fetch list", { professionalId, limit, offset });

  const { data, error } = await client
    .from("reviews_public")
    .select("id, professional_id, rating, comment, created_at")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.log("[reviews] fetch list error", error);
    throw error;
  }

  const reviews = (data ?? []).map(mapPublicRow);
  console.log("[reviews] fetch list ok", { count: reviews.length });
  return reviews;
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — stats agregados (avg rating + count) para StatsRow del perfil
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchProfessionalReviewStats(
  professionalId: string,
  client: TypedClient = supabase,
): Promise<ReviewStats> {
  console.log("[reviews] fetch stats", { professionalId });

  const { data, error } = await client.rpc("get_professional_review_stats", {
    p_id: professionalId,
  });

  if (error) {
    console.log("[reviews] fetch stats error", error);
    throw error;
  }

  // El RPC devuelve un array con 0 o 1 fila.
  const row = (data ?? [])[0] as StatsRow | undefined;

  const stats: ReviewStats = {
    // avg_rating viene como numeric → string en algunos drivers, o number.
    // Number(...) normaliza ambos casos.
    avgRating:   Number(row?.avg_rating ?? 0),
    reviewCount: Number(row?.review_count ?? 0),
  };

  console.log("[reviews] fetch stats ok", stats);
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — mi reseña para un profesional (prefill del form de edición)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchMyReviewFor(
  professionalId: string,
  client: TypedClient = supabase,
): Promise<MyReview | null> {
  console.log("[reviews] fetch my review", { professionalId });

  const { data, error } = await client.rpc("get_my_review_for", {
    p_id: professionalId,
  });

  if (error) {
    console.log("[reviews] fetch my review error", error);
    throw error;
  }

  // El RPC está declarado `returns reviews` (singular): supabase-js puede
  // devolver la fila directamente o envuelta en un array según versión.
  const row = (Array.isArray(data) ? data[0] : data) as ReviewRow | null | undefined;
  if (!row) {
    console.log("[reviews] fetch my review: none");
    return null;
  }

  const myReview = mapMyReviewRow(row);
  console.log("[reviews] fetch my review ok", { id: myReview.id, rating: myReview.rating });
  return myReview;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCRITURA — crear reseña
// reviewer_id se toma de auth.getUser() en el server vía RLS; lo mandamos
// explícito porque la policy lo exige en WITH CHECK.
// ─────────────────────────────────────────────────────────────────────────────

export async function createReview(
  input: CreateReviewInput,
  client: TypedClient = supabase,
): Promise<void> {
  console.log("[reviews] create", {
    professionalId: input.professionalId,
    rating:         input.rating,
    hasComment:     input.comment != null && input.comment.length > 0,
  });

  const { data: sessionData, error: sessionError } = await client.auth.getUser();
  if (sessionError) {
    console.log("[reviews] create: getUser error", sessionError);
    throw sessionError;
  }

  const reviewerId = sessionData.user?.id;
  if (!reviewerId) {
    console.log("[reviews] create: no session");
    throw new Error("Sesión expirada");
  }

  const { error } = await client.from("reviews").insert({
    professional_id: input.professionalId,
    reviewer_id:     reviewerId,
    rating:          input.rating,
    comment:         input.comment ?? null,
  });

  if (error) {
    console.log("[reviews] create error", error);
    throw error;
  }

  console.log("[reviews] create ok");
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCRITURA — actualizar reseña existente (RLS: solo autor)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateReview(
  reviewId: string,
  input: UpdateReviewInput,
  client: TypedClient = supabase,
): Promise<void> {
  console.log("[reviews] update", { reviewId, patchKeys: Object.keys(input) });

  const patch: { rating?: number; comment?: string | null } = {};
  if (input.rating !== undefined)  patch.rating  = input.rating;
  if (input.comment !== undefined) patch.comment = input.comment;

  const { error } = await client
    .from("reviews")
    .update(patch)
    .eq("id", reviewId);

  if (error) {
    console.log("[reviews] update error", error);
    throw error;
  }

  console.log("[reviews] update ok");
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCRITURA — borrar reseña (RLS: autor o admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteReview(
  reviewId: string,
  client: TypedClient = supabase,
): Promise<void> {
  console.log("[reviews] delete", { reviewId });

  const { error } = await client.from("reviews").delete().eq("id", reviewId);

  if (error) {
    console.log("[reviews] delete error", error);
    throw error;
  }

  console.log("[reviews] delete ok");
}
