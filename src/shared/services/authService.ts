// authService — wrapper de supabase.auth
// Capa: shared/services
// Funciones puras (sin React). Las consume el authStore y las pantallas de auth.
//
// Flujo passwordless OTP:
//   1. sendOtp(email)    → Supabase manda código de 6 dígitos al mail.
//   2. verifyOtp(...)    → si el código es correcto, devuelve session válida.
//   3. La sesión queda persistida en AsyncStorage por el cliente singleton.

import type { Session, AuthChangeEvent, Subscription } from "@supabase/supabase-js";

import { supabase } from "@/shared/services/supabase";

export async function sendOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // No mandamos emailRedirectTo: así Supabase manda el token OTP en vez del magic link.
    },
  });
  if (error) throw error;
}

export async function verifyOtp(email: string, token: string): Promise<Session> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  if (!data.session) throw new Error("verifyOtp no devolvió sesión");
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Suscribe un callback a cambios de estado de auth (login, logout, refresh).
 * Devolvé el `Subscription` para que el caller pueda desuscribirse en cleanup.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
