// Detalle completo de un profesional por id. Usado por /professionals/:id.
// Distinto de usePendingProfessional (que es para /requests/:id en triage).
// staleTime corto: suscripción y stats de reviews cambian por fuera del admin.

import { useQuery } from '@tanstack/react-query';

import { getProfessionalById } from '@/features/professionals/services/professionalsService';

export const professionalKey = (id: string) => ['professionals', 'detail', id] as const;

export function useProfessional(id: string | undefined) {
  return useQuery({
    queryKey:  professionalKey(id ?? ''),
    queryFn:   () => getProfessionalById(id as string),
    enabled:   !!id,
    staleTime: 10_000,
  });
}
