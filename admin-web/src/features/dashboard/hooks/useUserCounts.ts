// useUserCounts — React Query wrapper de getUserCounts.
// Cachea 60s: estos números no cambian en segundos, no vale la pena refetchear
// en cada re-render. Si el admin quiere refrescar, lo exponemos con refetch().

import { useQuery } from '@tanstack/react-query';

import { getUserCounts } from '@/features/dashboard/services/dashboardService';

export function useUserCounts() {
  return useQuery({
    queryKey:  ['dashboard', 'user-counts'],
    queryFn:   getUserCounts,
    staleTime: 60_000,
  });
}
