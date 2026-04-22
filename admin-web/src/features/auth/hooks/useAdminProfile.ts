// Fetch del profile del usuario logueado. Lo consume el guard RequireAdmin
// para decidir si el user es admin. Cacheado por React Query.

import { useQuery } from '@tanstack/react-query';
import type { Database } from '@shared/database.types';

import { supabase } from '@/shared/lib/supabaseClient';
import { useSession } from '@/app/providers/AuthProvider';

export type AdminProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'email' | 'role'
>;

async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function useAdminProfile() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['admin-profile', userId],
    queryFn:  () => fetchAdminProfile(userId as string),
    enabled:  !!userId,
    staleTime: 60_000,  // role no cambia seguido
  });
}
