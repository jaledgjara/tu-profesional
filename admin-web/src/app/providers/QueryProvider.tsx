// Provider de React Query. Centralizado acá para que las features sólo
// importen el hook useQuery/useMutation sin preocuparse de la config.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Admin panel: datos cambian seguido pero no queremos refetch agresivo.
      // 30s alcanza para que el trabajo continuo no dispare queries al toque,
      // pero tampoco dejamos data vieja mucho tiempo.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
