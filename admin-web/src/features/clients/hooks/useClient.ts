// Detalle de un cliente por id. Usado por /clients/:id.
// staleTime corto: la info puede cambiar (nuevas reseñas, moderación).

import { useQuery } from '@tanstack/react-query';

import { getClientById } from '@/features/clients/services/clientsService';

export const clientKey = (id: string) => ['clients', id] as const;

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey:  clientKey(id ?? ''),
    queryFn:   () => getClientById(id as string),
    enabled:   !!id,
    staleTime: 10_000,
  });
}
