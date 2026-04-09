// authStore — estado global de auth (Zustand)
// Capa: features/auth/store
// Fuente única de verdad para: sesión, profile y status del onboarding.
//
// El status manda en el guard de app/index.tsx:
//   loading         → splash
//   unauthenticated → /(auth)/WelcomeScreen
//   needs-role      → /(auth)/UserTypeScreen
//   needs-location  → /(auth)/{Client|Professional}LocationFormScreen / ProfessionalFormScreen
//   authenticated   → home según role

import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import * as authService from "@/shared/services/authService";
import * as profileService from "@/shared/services/profileService";
import { hasUserLocation } from "@/shared/services/locationService";

import type { Profile } from "@/shared/services/profileService";

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "needs-role"
  | "needs-location"
  | "authenticated";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  status:  AuthStatus;

  /** Recalcula sesión + profile + ubicación. Lo llaman _layout, screens y listeners. */
  refresh: () => Promise<void>;

  /** Wrapper de signOut que también limpia el store. */
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  status:  "loading",

  refresh: async () => {
    try {
      const session = await authService.getSession();

      if (!session) {
        set({ session: null, profile: null, status: "unauthenticated" });
        return;
      }

      const profile = await profileService.getProfile(session.user.id);

      if (!profile) {
        set({ session, profile: null, status: "needs-role" });
        return;
      }

      const hasLocation = await hasUserLocation(session.user.id);
      if (!hasLocation) {
        set({ session, profile, status: "needs-location" });
        return;
      }

      set({ session, profile, status: "authenticated" });
    } catch (err) {
      console.error("[authStore.refresh]", err);
      // En caso de error de red, no rompemos la app: dejamos loading false.
      set({ status: "unauthenticated" });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ session: null, profile: null, status: "unauthenticated" });
  },
}));
