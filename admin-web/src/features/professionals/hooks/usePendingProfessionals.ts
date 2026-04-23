// Lista de profesionales en status='pending'. Se refetchea cuando:
//   - El admin aprueba/rechaza (invalidación desde las mutations)
//   - El usuario vuelve a la pestaña (refetchOnWindowFocus)

import { useQuery } from '@tanstack/react-query';

import { listPendingProfessionals } from '@/features/professionals/services/professionalsService';

export const pendingProfessionalsKey = ['professionals', 'pending'] as const;

export function usePendingProfessionals() {
  return useQuery({
    queryKey:  pendingProfessionalsKey,
    queryFn:   listPendingProfessionals,
    staleTime: 30_000,
  });
}
