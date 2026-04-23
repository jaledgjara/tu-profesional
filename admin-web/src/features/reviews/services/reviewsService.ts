// reviewsService — queries y acciones de moderación de reseñas.
// Funciones puras; los hooks de React Query orquestan.
//
// Todas las RPCs son SECURITY DEFINER + is_admin(): el listado bypasea RLS
// para traer también las ocultas (con el join a profiles para reviewer_email),
// y las mutations auditan en admin_audit_log (0019).

import { supabase } from '@/shared/lib/supabaseClient';

export type ReviewListStatus = 'visible' | 'hidden' | 'all';

// Shape que devuelve admin_list_reviews — más rico que reviews_public porque
// el admin necesita el contexto completo para decidir si moderar.
export interface AdminReview {
  id:                       string;
  professional_id:          string;
  professional_name:        string | null;
  professional_photo_url:   string | null;
  reviewer_id:              string;
  reviewer_email:           string | null;
  rating:                   number;
  comment:                  string;
  created_at:               string;

  // Metadata de moderación (null si está visible)
  hidden_at:                string | null;
  hidden_by:                string | null;
  hidden_reason:            string | null;
  hidden_by_email:          string | null;
}

export interface ListReviewsParams {
  status?:         ReviewListStatus;
  rating?:         number;     // 1..5, undefined = todos
  professionalId?: string;     // uuid, undefined = todos
  search?:         string;
  page:            number;     // 1-indexed
  pageSize:        number;
}

export interface ListReviewsResult {
  rows:  AdminReview[];
  total: number;
}

export async function listReviews({
  status,
  rating,
  professionalId,
  search,
  page,
  pageSize,
}: ListReviewsParams): Promise<ListReviewsResult> {
  const offset = (Math.max(1, page) - 1) * pageSize;

  const { data, error } = await supabase.rpc('admin_list_reviews', {
    p_status:       status ?? null,
    p_rating:       rating ?? null,
    p_professional: professionalId ?? null,
    p_search:       search && search.trim() ? search.trim() : null,
    p_limit:        pageSize,
    p_offset:       offset,
  });

  if (error) throw error;

  const payload = data as { total: number; rows: AdminReview[] } | null;

  return {
    rows:  payload?.rows ?? [],
    total: Number(payload?.total ?? 0),
  };
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function hideReview(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_hide_review', {
    p_id:     id,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function unhideReview(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unhide_review', { p_id: id });
  if (error) throw error;
}

export async function deleteReview(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_review', {
    p_id:     id,
    p_reason: reason,
  });
  if (error) throw error;
}
