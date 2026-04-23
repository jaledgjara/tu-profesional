// Count de solicitudes pendientes para el badge del sidebar.
// Poll cada 30s para que si llega una solicitud nueva mientras el admin está
// en otra pantalla, el badge aparezca solo.

import { useQuery } from '@tanstack/react-query';

import { countPendingProfessionals } from '@/features/professionals/services/professionalsService';

export const pendingCountKey = ['professionals', 'pending', 'count'] as const;

export function usePendingCount() {
  return useQuery({
    queryKey:        pendingCountKey,
    queryFn:         countPendingProfessionals,
    staleTime:       15_000,
    refetchInterval: 30_000,
  });
}
