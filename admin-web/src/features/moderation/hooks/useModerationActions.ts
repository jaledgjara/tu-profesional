// Hooks de mutation para acciones de moderación sobre usuarios (client o
// profesional — mismo profiles.id, mismos RPCs).
//
// Cada hook invalida las queries afectadas tras el éxito:
//   - Detalle del cliente y del pro (por si es un pro que también existe como profile)
//   - Listados paginados
//
// Por qué invalidar todo el árbol 'clients' / 'professionals' y no sólo
// la key exacta: los listados tienen keys derivadas (page/search/status).
// `invalidateQueries({ queryKey: ['clients'] })` invalida todas las
// variantes sin que tengamos que hardcodear cada una.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  suspendUser,
  unsuspendUser,
  deleteUser,
  restoreUser,
} from '@/features/clients/services/clientsService';

function useInvalidateUserQueries() {
  const qc = useQueryClient();
  return (userId: string) => {
    qc.invalidateQueries({ queryKey: ['clients'] });
    qc.invalidateQueries({ queryKey: ['professionals'] });
    // Detalle específico: fuerza re-fetch inmediato, no el next-mount.
    qc.invalidateQueries({ queryKey: ['clients', userId] });
    qc.invalidateQueries({ queryKey: ['professionals', 'detail', userId] });
  };
}

export function useSuspendUser() {
  const invalidate = useInvalidateUserQueries();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendUser(id, reason),
    onSuccess: (_, { id }) => invalidate(id),
  });
}

export function useUnsuspendUser() {
  const invalidate = useInvalidateUserQueries();
  return useMutation({
    mutationFn: (id: string) => unsuspendUser(id),
    onSuccess: (_, id) => invalidate(id),
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUserQueries();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      deleteUser(id, reason),
    onSuccess: (_, { id }) => invalidate(id),
  });
}

export function useRestoreUser() {
  const invalidate = useInvalidateUserQueries();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: (_, id) => invalidate(id),
  });
}
