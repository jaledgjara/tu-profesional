// dashboardService — queries agregadas para los KPIs del admin panel.
// Funciones puras (sin React). Las consume el hook useUserCounts y futuros hooks.
//
// `count: 'exact'` + `head: true` es el patrón oficial de Supabase para pedir
// sólo el conteo sin traer filas — cero ancho de banda de payload.
//
// RLS: admin puede SELECT todo en profiles (migración 0003), así que el count
// refleja la cantidad real de filas.

import { supabase } from '@/shared/lib/supabaseClient';

export interface UserCounts {
  clients:       number;
  professionals: number;
}

export async function getUserCounts(): Promise<UserCounts> {
  const [clientsRes, prosRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'professional'),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (prosRes.error)    throw prosRes.error;

  return {
    clients:       clientsRes.count ?? 0,
    professionals: prosRes.count    ?? 0,
  };
}
