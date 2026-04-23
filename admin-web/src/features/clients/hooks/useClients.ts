// useClients — listado paginado de clientes. La query key incluye page y
// search para que React Query cachee cada combinación. `placeholderData`
// en `keepPreviousData` evita el flash de spinner al cambiar de página
// (la tabla se queda con la data vieja hasta que llega la nueva).

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listClients } from '@/features/clients/services/clientsService';

interface UseClientsParams {
  page:     number;
  pageSize: number;
  search?:  string;
}

export function clientsKey(params: UseClientsParams) {
  return ['clients', params] as const;
}

export function useClients(params: UseClientsParams) {
  return useQuery({
    queryKey:        clientsKey(params),
    queryFn:         () => listClients(params),
    staleTime:       15_000,
    placeholderData: keepPreviousData,
  });
}
