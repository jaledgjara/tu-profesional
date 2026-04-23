// useProfessionals — listado paginado de profesionales para /professionals.
// Independiente de usePendingProfessionals (que es solo para /requests).
//
// keepPreviousData evita el parpadeo al cambiar de página o búsqueda.

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  listProfessionals,
  type ProfessionalStatus,
} from '@/features/professionals/services/professionalsService';

interface UseProfessionalsParams {
  page:     number;
  pageSize: number;
  status?:  ProfessionalStatus;
  search?:  string;
}

export function professionalsKey(params: UseProfessionalsParams) {
  return ['professionals', 'list', params] as const;
}

export function useProfessionals(params: UseProfessionalsParams) {
  return useQuery({
    queryKey:        professionalsKey(params),
    queryFn:         () => listProfessionals(params),
    staleTime:       15_000,
    placeholderData: keepPreviousData,
  });
}
