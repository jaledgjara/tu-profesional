// Lista de profesionales en status='pending'. Se refetchea cuando:
//   - El admin aprueba/rechaza (invalidación desde las mutations)
//   - El usuario vuelve a la pestaña (refetchOnWindowFocus por default)
//   - Cada 30s mientras la screen está montada, para que si llega una solicitud
//     nueva mientras el admin revisa la lista, aparezca sola (coincide con
//     el poll del badge del sidebar).

import { useQuery } from '@tanstack/react-query';

import { listPendingProfessionals } from '@/features/professionals/services/professionalsService';

export const pendingProfessionalsKey = ['professionals', 'pending'] as const;

export function usePendingProfessionals() {
  return useQuery({
    queryKey:        pendingProfessionalsKey,
    queryFn:         listPendingProfessionals,
    staleTime:       15_000,
    refetchInterval: 30_000,
  });
}
