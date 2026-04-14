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

// ─────────────────────────────────────────────────────────────────────────────
// SINGLEFLIGHT — evita que refresh() corra dos veces en paralelo.
// Si dos eventos de auth llegan al mismo tiempo (p.ej. INITIAL_SESSION + SIGNED_IN),
// la segunda invocación se suma a la promesa en curso en vez de disparar otra.
// Vive a nivel de módulo porque no debe perderse entre renders.
// ─────────────────────────────────────────────────────────────────────────────

let inFlightRefresh: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  status:  "loading",

  refresh: async () => {
    if (inFlightRefresh) {
      console.log("[authStore::refresh] Ya hay un refresh en curso — me sumo a esa promesa.");
      return inFlightRefresh;
    }

    inFlightRefresh = (async () => {
      console.log("[authStore::refresh] Iniciando evaluación del estado de auth…");
      try {
        const session = await authService.getSession();

        if (!session) {
          console.log("[authStore::refresh] Sin sesión → status: unauthenticated");
          set({ session: null, profile: null, status: "unauthenticated" });
          return;
        }
        console.log("[authStore::refresh] Sesión activa — userId:", session.user.id, "| email:", session.user.email);

        const profile = await profileService.getProfile(session.user.id);

        if (!profile) {
          console.log("[authStore::refresh] Sin profile → status: needs-role (el user debe elegir su rol)");
          set({ session, profile: null, status: "needs-role" });
          return;
        }
        console.log("[authStore::refresh] Profile encontrado — rol:", profile.role);

        const hasLocation = await hasUserLocation(session.user.id);
        if (!hasLocation) {
          console.log("[authStore::refresh] Sin ubicación → status: needs-location (el user debe completar su dirección)");
          set({ session, profile, status: "needs-location" });
          return;
        }

        console.log("[authStore::refresh] Todo completo → status: authenticated ✓ — el guard enviará al home de rol:", profile.role);
        set({ session, profile, status: "authenticated" });
      } catch (err) {
        // Error transitorio (red, Supabase re-inicializándose tras HMR, timeout, etc.).
        // NO forzamos `unauthenticated`: perderíamos la sesión real persistida en
        // AsyncStorage y mandaríamos al user al Welcome sin motivo. Preservamos el
        // status vigente; el próximo evento de auth o un refresh posterior resuelven.
        const currentStatus = get().status;
        console.warn(
          "[authStore::refresh] Error transitorio — preservo status actual:",
          currentStatus,
          "| error:",
          err,
        );
        // Si todavía estábamos en el arranque (loading) y nunca logramos evaluar,
        // caemos a unauthenticated: no podemos demostrar sesión, pero no hubo una
        // autenticación previa que valga la pena proteger.
        if (currentStatus === "loading") {
          set({ status: "unauthenticated" });
        }
      } finally {
        inFlightRefresh = null;
      }
    })();

    return inFlightRefresh;
  },

  signOut: async () => {
    console.log("[authStore::signOut] Limpiando store y cerrando sesión…");
    await authService.signOut();
    set({ session: null, profile: null, status: "unauthenticated" });
    console.log("[authStore::signOut] Store limpio → status: unauthenticated");
  },
}));
