// Mutation: rechazar un profesional con razón obligatoria.
// La validación de longitud mínima vive en el RPC (min 10 chars) y también
// en el formulario del dialog para feedback inmediato al admin.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rejectProfessional } from '@/features/professionals/services/professionalsService';
import { pendingProfessionalsKey } from '@/features/professionals/hooks/usePendingProfessionals';
import { pendingCountKey } from '@/features/professionals/hooks/usePendingCount';

interface RejectArgs {
  id:     string;
  reason: string;
}

export function useRejectProfessional() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: RejectArgs) => rejectProfessional(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pendingProfessionalsKey });
      qc.invalidateQueries({ queryKey: pendingCountKey });
    },
  });
}
