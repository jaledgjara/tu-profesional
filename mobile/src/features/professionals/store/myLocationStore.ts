// myLocationStore — estado compartido de la fila `user_locations` del user
// logueado. Capa: features/professionals/store
//
// Mismo razonamiento que professionalProfileStore: con state local en el hook
// cada screen tiene su propia copia y no se entera de updates cruzados.
// Acá centralizamos para que un edit en cualquier lado se vea en todos lados.

import { create } from "zustand";

import {
  getMyUserLocation,
  type UserLocationAddress,
} from "@/shared/services/locationService";

interface MyLocationState {
  location:      UserLocationAddress | null;
  isLoading:     boolean;
  error:         Error | null;
  currentUserId: string | null;

  load:    (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset:   () => void;
}

export const useMyLocationStore = create<MyLocationState>((set, get) => ({
  location:      null,
  isLoading:     false,
  error:         null,
  currentUserId: null,

  load: async (userId) => {
    const state = get();
    if (state.currentUserId === userId && state.location && !state.error) {
      return;
    }
    if (state.currentUserId !== userId) {
      set({ location: null });
    }
    set({ isLoading: true, error: null, currentUserId: userId });
    try {
      const row = await getMyUserLocation(userId);
      set({ location: row, isLoading: false });
    } catch (err) {
      console.error("[myLocationStore::load] Error:", err);
      set({
        isLoading: false,
        error: err instanceof Error
          ? err
          : new Error("No pudimos cargar tu ubicación. Intentá de nuevo."),
      });
    }
  },

  refresh: async () => {
    const userId = get().currentUserId;
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const row = await getMyUserLocation(userId);
      set({ location: row, isLoading: false });
    } catch (err) {
      console.error("[myLocationStore::refresh] Error:", err);
      set({
        isLoading: false,
        error: err instanceof Error
          ? err
          : new Error("No pudimos refrescar tu ubicación. Intentá de nuevo."),
      });
    }
  },

  reset: () => set({
    location:      null,
    isLoading:     false,
    error:         null,
    currentUserId: null,
  }),
}));
