// useReviews — listado paginado de reseñas para moderación.
// keepPreviousData evita el flash de spinner al cambiar de página/filtro.

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  listReviews,
  type ListReviewsParams,
} from '@/features/reviews/services/reviewsService';

export function reviewsKey(params: ListReviewsParams) {
  return ['reviews', 'list', params] as const;
}

export function useReviews(params: ListReviewsParams) {
  return useQuery({
    queryKey:        reviewsKey(params),
    queryFn:         () => listReviews(params),
    staleTime:       15_000,
    placeholderData: keepPreviousData,
  });
}
