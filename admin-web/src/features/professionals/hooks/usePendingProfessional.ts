// Detalle completo de un profesional por id. Usado por /requests/:id.
// staleTime corto: la info puede cambiar si el pro edita su perfil.

import { useQuery } from '@tanstack/react-query';

import { getPendingProfessional } from '@/features/professionals/services/professionalsService';

export const pendingProfessionalKey = (id: string) =>
  ['professionals', 'pending', id] as const;

export function usePendingProfessional(id: string | undefined) {
  return useQuery({
    queryKey:  pendingProfessionalKey(id ?? ''),
    queryFn:   () => getPendingProfessional(id as string),
    enabled:   !!id,
    staleTime: 10_000,
  });
}
