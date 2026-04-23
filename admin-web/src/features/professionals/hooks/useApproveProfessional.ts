// Mutation: aprobar un profesional. Invalida la lista y el count para que
// tabla y badge reflejen el cambio.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { approveProfessional } from '@/features/professionals/services/professionalsService';
import { pendingProfessionalsKey } from '@/features/professionals/hooks/usePendingProfessionals';
import { pendingCountKey } from '@/features/professionals/hooks/usePendingCount';

export function useApproveProfessional() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveProfessional(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pendingProfessionalsKey });
      qc.invalidateQueries({ queryKey: pendingCountKey });
    },
  });
}
