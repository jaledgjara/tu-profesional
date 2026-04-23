// professionalsService — queries y acciones de moderación de profesionales.
// Funciones puras (sin React). Las consumen los hooks de React Query.
//
// RLS: admin ve todo en professionals y profiles (0003_fix_admin_rls_recursion.sql).
// Los RPCs approve/reject son SECURITY DEFINER y validan is_admin() internamente.

import { supabase } from '@/shared/lib/supabaseClient';

// Shape resumido para las cards del listado. Lo mínimo que el admin necesita
// para decidir si "revisar" la solicitud; el detalle completo vive en
// PendingProfessionalDetail y se pide cuando entra a /requests/:id.
export interface PendingProfessional {
  id:                 string;
  full_name:          string | null;
  email:              string | null;
  photo_url:          string | null;
  specialty:          string | null;
  professional_area:  string[];
  license:            string | null;
  dni:                string | null;
  phone:              string | null;
  description:        string | null;
  created_at:         string;
}

// Shape completo con TODOS los campos relevantes para moderar desde la página
// de detalle. Incluye ubicación (join separado a user_locations) si el pro la
// cargó; si no, location queda en null.
export interface ProfessionalLocation {
  street:      string;
  number:      string;
  floor:       string | null;
  apartment:   string | null;
  city:        string | null;
  province:    string | null;
  country:     string | null;
  postal_code: string | null;
}

export interface PendingProfessionalDetail {
  id:                 string;
  full_name:          string | null;
  email:              string | null;
  phone:              string | null;
  dni:                string | null;
  license:            string | null;
  photo_url:          string | null;
  category:           string;
  specialty:          string | null;
  sub_specialties:    string[];
  professional_area:  string[];
  description:        string | null;
  quote:              string | null;
  quote_author:       string | null;
  attends_online:     boolean;
  attends_presencial: boolean;
  status:             'pending' | 'approved' | 'rejected';
  rejection_reason:   string | null;
  is_active:          boolean;
  created_at:         string;
  social_whatsapp:    string | null;
  social_instagram:   string | null;
  social_linkedin:    string | null;
  social_twitter:     string | null;
  social_tiktok:      string | null;
  location:           ProfessionalLocation | null;
}

// Campos que traemos. El join con profiles usa el hint del FK id → profiles.id
// para evitar ambigüedad con el otro FK (reviewed_by → profiles.id).
const PENDING_SELECT = `
  id,
  full_name,
  photo_url,
  specialty,
  professional_area,
  license,
  dni,
  phone,
  description,
  created_at,
  profile:profiles!professionals_id_fkey ( email )
`;

export async function listPendingProfessionals(): Promise<PendingProfessional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select(PENDING_SELECT)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id:                row.id,
    full_name:         row.full_name,
    email:             row.profile?.email ?? null,
    photo_url:         row.photo_url,
    specialty:         row.specialty,
    professional_area: row.professional_area ?? [],
    license:           row.license,
    dni:               row.dni,
    phone:             row.phone,
    description:       row.description,
    created_at:        row.created_at,
  }));
}

// Detalle completo de un profesional por id. Devuelve null si no existe (404).
// La ubicación se pide en paralelo con un select directo a user_locations
// (RLS: admin puede SELECT por policy desde 0003). `maybeSingle()` no rompe
// si el pro no cargó ubicación.
export async function getPendingProfessional(id: string): Promise<PendingProfessionalDetail | null> {
  const proPromise = supabase
    .from('professionals')
    .select(`
      id, full_name, phone, dni, license, photo_url,
      category, specialty, sub_specialties, professional_area,
      description, quote, quote_author,
      attends_online, attends_presencial,
      status, rejection_reason, is_active, created_at,
      social_whatsapp, social_instagram, social_linkedin, social_twitter, social_tiktok,
      profile:profiles!professionals_id_fkey ( email )
    `)
    .eq('id', id)
    .maybeSingle();

  const locationPromise = supabase
    .from('user_locations')
    .select('street, number, floor, apartment, city, province, country, postal_code')
    .eq('user_id', id)
    .maybeSingle();

  const [proRes, locRes] = await Promise.all([proPromise, locationPromise]);

  if (proRes.error) throw proRes.error;
  if (!proRes.data) return null;
  if (locRes.error) throw locRes.error;

  const pro = proRes.data;

  return {
    id:                 pro.id,
    full_name:          pro.full_name,
    email:              pro.profile?.email ?? null,
    phone:              pro.phone,
    dni:                pro.dni,
    license:            pro.license,
    photo_url:          pro.photo_url,
    category:           pro.category,
    specialty:          pro.specialty,
    sub_specialties:    pro.sub_specialties ?? [],
    professional_area:  pro.professional_area ?? [],
    description:        pro.description,
    quote:              pro.quote,
    quote_author:       pro.quote_author,
    attends_online:     pro.attends_online,
    attends_presencial: pro.attends_presencial,
    status:             pro.status,
    rejection_reason:   pro.rejection_reason,
    is_active:          pro.is_active,
    created_at:         pro.created_at,
    social_whatsapp:    pro.social_whatsapp,
    social_instagram:   pro.social_instagram,
    social_linkedin:    pro.social_linkedin,
    social_twitter:     pro.social_twitter,
    social_tiktok:      pro.social_tiktok,
    location:           locRes.data ?? null,
  };
}

// Count-only: sin payload. Usado por el badge del sidebar con poll cada 30s.
export async function countPendingProfessionals(): Promise<number> {
  const { count, error } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count ?? 0;
}

export async function approveProfessional(id: string): Promise<void> {
  const { error } = await supabase.rpc('approve_professional', { p_id: id });
  if (error) throw error;
}

export async function rejectProfessional(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('reject_professional', {
    p_id:     id,
    p_reason: reason,
  });
  if (error) throw error;
}

// =============================================================================
// Listado paginado para la screen /professionals (distinta de /requests, que
// solo muestra pendientes). Usa el RPC admin_list_professionals: acepta un
// filtro de status opcional y búsqueda por nombre/email/matrícula/especialidad.
// Devuelve { rows, total } en una sola llamada.
// =============================================================================

export type ProfessionalStatus = 'pending' | 'approved' | 'rejected';

export interface AdminProfessional {
  id:                 string;
  full_name:          string | null;
  email:              string | null;
  photo_url:          string | null;
  license:            string | null;
  specialty:          string | null;
  professional_area:  string[];
  status:             ProfessionalStatus;
  is_active:          boolean;
  created_at:         string;
  // Moderación de profile (suspensión/delete) — sumado en 0022.
  suspended_at:       string | null;
  deleted_at:         string | null;
}

export interface ListProfessionalsParams {
  status?:  ProfessionalStatus;
  search?:  string;
  page:     number;
  pageSize: number;
}

export interface ListProfessionalsResult {
  rows:  AdminProfessional[];
  total: number;
}

export async function listProfessionals({
  status,
  search,
  page,
  pageSize,
}: ListProfessionalsParams): Promise<ListProfessionalsResult> {
  const offset = (Math.max(1, page) - 1) * pageSize;

  const { data, error } = await supabase.rpc('admin_list_professionals', {
    p_status: status ?? null,
    p_search: search && search.trim() ? search.trim() : null,
    p_limit:  pageSize,
    p_offset: offset,
  });

  if (error) throw error;

  const payload = data as { total: number; rows: AdminProfessional[] } | null;

  return {
    rows: (payload?.rows ?? []).map((r) => ({
      ...r,
      professional_area: r.professional_area ?? [],
    })),
    total: Number(payload?.total ?? 0),
  };
}


// =============================================================================
// Detalle por id — consumido por /professionals/:id
// =============================================================================
// Distinto de getPendingProfessional (que es del flujo /requests/:id sobre
// professionals recién creados). Acá el RPC admin_get_professional_by_id
// devuelve TODO en un solo payload: profile + professional + location +
// suscripción + historial de moderación + stats/reviews recibidas.
//
// Se consume desde ProfessionalDetailScreen y habilita las acciones admin
// (suspender, forzar logout, pausar suscripción) que aterrizan en Sprint B/C.

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled';

export interface AdminProfessionalReview {
  id:             string;
  reviewer_id:    string;
  reviewer_email: string | null;
  rating:         number;
  comment:        string | null;
  created_at:     string;
  hidden_at:      string | null;
  hidden_reason:  string | null;
}

export interface AdminProfessionalDetail {
  profile: {
    id:                 string;
    email:              string | null;
    role:               'professional';
    created_at:         string;
    suspended_at:       string | null;
    suspension_reason:  string | null;
    deleted_at:         string | null;
  };
  auth: {
    last_sign_in_at: string | null;
  };
  professional: {
    id:                  string;
    full_name:           string | null;
    phone:               string | null;
    dni:                 string | null;
    license:             string | null;
    photo_url:           string | null;
    category:            string;
    specialty:           string | null;
    sub_specialties:     string[];
    professional_area:   string[];
    description:         string | null;
    quote:               string | null;
    quote_author:        string | null;
    attends_online:      boolean;
    attends_presencial:  boolean;
    is_active:           boolean;
    status:              ProfessionalStatus;
    created_at:          string;
    updated_at:          string;
    social_whatsapp:     string | null;
    social_instagram:    string | null;
    social_linkedin:     string | null;
    social_twitter:      string | null;
    social_tiktok:       string | null;
  } | null;
  location: ProfessionalLocation | null;
  subscription: {
    status:            SubscriptionStatus;
    ends_at:           string | null;
    trial_ends_at:     string | null;
    mp_preapproval_id: string | null;
  } | null;
  moderation: {
    reviewed_at:       string | null;
    reviewed_by:       string | null;
    reviewed_by_email: string | null;
    rejection_reason:  string | null;
  } | null;
  // Moderación del profile: suspend/delete. Separado de `moderation`
  // (que es sobre aprobación del perfil profesional) para no mezclarlos.
  user_moderation: {
    suspended_at:        string | null;
    suspended_by:        string | null;
    suspended_by_email:  string | null;
    suspension_reason:   string | null;
    deleted_at:          string | null;
    deleted_by:          string | null;
    deleted_by_email:    string | null;
  };
  reviews_stats: {
    total:             number;
    visible:           number;
    hidden:            number;
    avg_rating:        number;
    rating_breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  reviews: AdminProfessionalReview[];
}

export async function getProfessionalById(id: string): Promise<AdminProfessionalDetail | null> {
  const { data, error } = await supabase.rpc('admin_get_professional_by_id', { p_id: id });
  if (error) throw error;
  if (!data) return null;

  // El RPC devuelve sub_specialties/professional_area como null si la fila
  // no los tiene seteados — normalizamos a [] para que el front no tenga
  // que ramificar en cada render.
  const raw = data as AdminProfessionalDetail;
  return {
    ...raw,
    professional: raw.professional
      ? {
          ...raw.professional,
          sub_specialties:   raw.professional.sub_specialties   ?? [],
          professional_area: raw.professional.professional_area ?? [],
        }
      : null,
  };
}


// =============================================================================
// Acciones de moderación — Sprint B
// =============================================================================
// Los RPCs admin_suspend_user/admin_unsuspend_user/admin_soft_delete_user/
// admin_restore_user operan sobre profiles.id — vale igual para client y pro.
// Re-exportamos desde el service del pro para que los hooks de este feature
// tengan un único punto de import.

export {
  suspendUser,
  unsuspendUser,
  deleteUser,
  restoreUser,
} from '@/features/clients/services/clientsService';
