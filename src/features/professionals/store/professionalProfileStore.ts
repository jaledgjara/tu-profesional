// professionalProfileStore — estado compartido de la fila `professionals`
// del usuario logueado. Capa: features/professionals/store
//
// Por qué un store y no un hook con state local:
//   El hook con `useState` adentro hace que cada screen tenga su propia copia.
//   Cuando edit-profile guarda y refetchea, sólo actualiza SU instancia, no
//   la del briefcase ni la del home. Resultado: data desincronizada hasta
//   que el user navega y re-monta. Con Zustand, todos los consumidores leen
//   del MISMO state y se re-renderizan juntos cuando cambia.

import { create } from "zustand";

import {
  getProfessional,
  type Professional as ProfessionalRow,
} from "@/shared/services/profileService";

interface ProfessionalProfileState {
  /** Fila actual de `professionals` del user logueado, o null si aún no se cargó. */
  professional: ProfessionalRow | null;
  /** True mientras hay una request en vuelo (load o refresh). */
  isLoading:    boolean;
  /** Último error de fetch. Se limpia con cada nuevo intento exitoso. */
  error:        Error | null;
  /** userId al que pertenece el state actual — para deduplicar y detectar cambios. */
  currentUserId: string | null;

  /**
   * Carga la fila para `userId`. Idempotente: si ya tenemos data del mismo
   * user, no dispara red — el consumidor sigue viendo lo cacheado y, si
   * quiere forzar, llama a `refresh()`.
   */
  load:    (userId: string) => Promise<void>;
  /** Re-fetchea la fila del user actual. Usado tras un upsert. */
  refresh: () => Promise<void>;
  /** Limpia todo el state. Llamar al hacer signOut. */
  reset:   () => void;
}

export const useProfessionalProfileStore = create<ProfessionalProfileState>((set, get) => ({
  professional:  null,
  isLoading:     false,
  error:         null,
  currentUserId: null,

  load: async (userId) => {
    const state = get();
    // Mismo user + ya hay data + sin error → no re-pegamos a la red.
    if (state.currentUserId === userId && state.professional && !state.error) {
      return;
    }
    // Cambió el user (login/logout) → reset antes de cargar.
    if (state.currentUserId !== userId) {
      set({ professional: null });
    }
    set({ isLoading: true, error: null, currentUserId: userId });
    try {
      const row = await getProfessional(userId);
      set({ professional: row, isLoading: false });
    } catch (err) {
      console.error("[professionalProfileStore::load] Error:", err);
      set({
        isLoading: false,
        error: err instanceof Error
          ? err
          : new Error("No pudimos cargar tu perfil profesional. Intentá de nuevo."),
      });
    }
  },

  refresh: async () => {
    const userId = get().currentUserId;
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const row = await getProfessional(userId);
      set({ professional: row, isLoading: false });
    } catch (err) {
      console.error("[professionalProfileStore::refresh] Error:", err);
      set({
        isLoading: false,
        error: err instanceof Error
          ? err
          : new Error("No pudimos refrescar tu perfil profesional. Intentá de nuevo."),
      });
    }
  },

  reset: () => set({
    professional:  null,
    isLoading:     false,
    error:         null,
    currentUserId: null,
  }),
}));
