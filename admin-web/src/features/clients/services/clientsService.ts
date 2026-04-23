// clientsService — queries de admin sobre usuarios con role='client'.
// Fn puras; los hooks de React Query las orquestan.
//
// El listado se pide vía RPC admin_list_clients que devuelve
// { total, rows } en una sola llamada (0018_admin_list_rpcs.sql).

import { supabase } from '@/shared/lib/supabaseClient';

// Los clientes son anónimos por decisión de producto: solo email, sin nombre
// ni teléfono en profiles. Mantenemos full_name/phone como nullable para que
// el shape sea estable, pero siempre vienen en null desde la RPC.
export interface AdminClient {
  id:            string;
  full_name:     string | null;
  email:         string | null;
  phone:         string | null;
  created_at:    string;
  is_active:     boolean;
  // Campos de moderación (agregados en 0022). El front los usa para elegir
  // el badge del listado y qué item mostrar en el dropdown (Suspender vs
  // Reactivar, Eliminar vs Restaurar).
  suspended_at:  string | null;
  deleted_at:    string | null;
}

export interface ListClientsParams {
  search?:    string;
  page:       number;   // 1-indexed
  pageSize:   number;
}

export interface ListClientsResult {
  rows:  AdminClient[];
  total: number;
}

export async function listClients({
  search,
  page,
  pageSize,
}: ListClientsParams): Promise<ListClientsResult> {
  const offset = (Math.max(1, page) - 1) * pageSize;

  const { data, error } = await supabase.rpc('admin_list_clients', {
    p_search: search && search.trim() ? search.trim() : null,
    p_limit:  pageSize,
    p_offset: offset,
  });

  if (error) throw error;

  // La RPC devuelve un JSON tipado como `Json` por supabase-js. Validamos el
  // shape mínimo antes de retornar para que los componentes reciban un tipo
  // limpio en vez de propagar `any`.
  const payload = data as { total: number; rows: AdminClient[] } | null;

  return {
    rows:  payload?.rows ?? [],
    total: Number(payload?.total ?? 0),
  };
}


// =============================================================================
// Detalle por id — consumido por /clients/:id
// =============================================================================
// El RPC admin_get_client_by_id devuelve todo lo necesario para la pantalla
// en un solo round-trip: profile + último sign-in + stats de reseñas escritas
// + últimas 20 reseñas con datos del profesional referenciado.
// Devuelve null si el id no existe o no es role='client' (lo tratamos como 404).

export interface AdminClientReview {
  id:                     string;
  professional_id:        string;
  professional_name:      string | null;
  professional_photo_url: string | null;
  rating:                 number;
  comment:                string | null;
  created_at:             string;
  hidden_at:              string | null;
  hidden_reason:          string | null;
}

// Bloque de moderación que reusan client y professional. Lo dejamos como
// tipo compartido para que el front tenga un único lugar donde chequear
// "¿este user está suspendido o borrado?".
export interface UserModerationInfo {
  suspended_at:        string | null;
  suspended_by:        string | null;
  suspended_by_email:  string | null;
  suspension_reason:   string | null;
  deleted_at:          string | null;
  deleted_by:          string | null;
  deleted_by_email:    string | null;
}

export interface AdminClientDetail {
  profile: {
    id:                 string;
    email:              string | null;
    role:               'client';
    created_at:         string;
    suspended_at:       string | null;
    suspension_reason:  string | null;
    deleted_at:         string | null;
  };
  auth: {
    last_sign_in_at: string | null;
  };
  moderation: UserModerationInfo;
  reviews_stats: {
    total:      number;
    visible:    number;
    hidden:     number;
    avg_rating: number;
  };
  reviews: AdminClientReview[];
}

export async function getClientById(id: string): Promise<AdminClientDetail | null> {
  const { data, error } = await supabase.rpc('admin_get_client_by_id', { p_id: id });
  if (error) throw error;
  return (data as AdminClientDetail | null) ?? null;
}


// =============================================================================
// Acciones de moderación — Sprint B
// =============================================================================
// Envueltas en funciones puras que llaman a las RPCs de 0022. El caller
// (los hooks useSuspendUser etc.) se encarga de invalidar las queries
// afectadas tras el éxito.

/** Suspende al user. Requiere razón ≥10 chars. */
export async function suspendUser(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_suspend_user', {
    p_id:     id,
    p_reason: reason,
  });
  if (error) throw error;
}

/** Revierte la suspensión. */
export async function unsuspendUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unsuspend_user', { p_id: id });
  if (error) throw error;
}

/** Soft delete. Requiere razón ≥20 chars. */
export async function deleteUser(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_soft_delete_user', {
    p_id:     id,
    p_reason: reason,
  });
  if (error) throw error;
}

/** Revierte el soft delete. */
export async function restoreUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_restore_user', { p_id: id });
  if (error) throw error;
}
