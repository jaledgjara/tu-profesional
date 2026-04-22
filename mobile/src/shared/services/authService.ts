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
  console.log("[authService::sendOtp] Enviando OTP →", email);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // OTP vs magic link NO depende de emailRedirectTo — depende del email template
      // en el dashboard: Authentication → Email Templates → "Magic Link" → usar {{ .Token }}.
    },
  });
  if (error) {
    console.error("[authService::sendOtp] Error de Supabase →", error.message);
    throw error;
  }
  console.log("[authService::sendOtp] OTP enviado correctamente a", email);
}

export async function verifyOtp(email: string, token: string): Promise<Session> {
  console.log("[authService::verifyOtp] Verificando código OTP para", email, "| longitud token:", token.length);
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    console.error("[authService::verifyOtp] Código incorrecto o expirado →", error.message);
    throw error;
  }
  if (!data.session) {
    console.error("[authService::verifyOtp] Supabase no devolvió sesión — data:", data);
    throw new Error("verifyOtp no devolvió sesión");
  }
  console.log("[authService::verifyOtp] Sesión obtenida — userId:", data.session.user.id, "| expira:", new Date(data.session.expires_at! * 1000).toISOString());
  return data.session;
}

export async function signOut(): Promise<void> {
  console.log("[authService::signOut] Cerrando sesión…");
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[authService::signOut] Error al cerrar sesión →", error.message);
    throw error;
  }
  console.log("[authService::signOut] Sesión cerrada correctamente.");
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[authService::getSession] Error al leer sesión →", error.message);
    throw error;
  }
  if (data.session) {
    console.log("[authService::getSession] Sesión activa — userId:", data.session.user.id);
  } else {
    console.log("[authService::getSession] No hay sesión activa.");
  }
  return data.session;
}

/**
 * Suscribe un callback a cambios de estado de auth (login, logout, refresh).
 * Devolvé el `Subscription` para que el caller pueda desuscribirse en cleanup.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  console.log("[authService::onAuthStateChange] Registrando listener de cambios de auth.");
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    console.log("[authService::onAuthStateChange] Evento:", event, "| userId:", session?.user.id ?? "—");
    callback(event, session);
  });
  return data.subscription;
}
