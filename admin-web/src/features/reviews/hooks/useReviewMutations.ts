// useReviewMutations — mutations de moderación (hide / unhide / delete).
// Al completar, invalidan todos los queries ['reviews', ...] para que el
// listado abierto reflejé el cambio sin refetch manual.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  hideReview,
  unhideReview,
  deleteReview,
} from '@/features/reviews/services/reviewsService';

function useInvalidateReviews() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['reviews'] });
}

export function useHideReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => hideReview(id, reason),
    onSuccess:  invalidate,
  });
}

export function useUnhideReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (id: string) => unhideReview(id),
    onSuccess:  invalidate,
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteReview(id, reason),
    onSuccess:  invalidate,
  });
}
