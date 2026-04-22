// adminAuthService — wrappers finitos alrededor de supabase.auth.
// Sin React. Lo consumen el AuthProvider y los forms de auth.
//
// No usamos OTP/magic link como en mobile: acá los admins tienen password
// obligatorio (ver plan). La única vía sin password es el flujo de invite/reset,
// que Supabase maneja con el mismo mecanismo de "recovery session".

import type { Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

import { supabase } from '@/shared/lib/supabaseClient';

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('signInWithPassword no devolvió sesión');
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
 * Suscribe un callback a eventos de auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
 * PASSWORD_RECOVERY, etc.). Devuelve la Subscription para cleanup.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

/**
 * Actualiza la contraseña del usuario autenticado. Requiere sesión activa —
 * se usa tanto al aceptar un invite como al completar un reset de contraseña.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Dispara el email de reset de contraseña. `redirectTo` apunta a /set-password
 * del mismo origin donde corre admin-web (localhost en dev, subdominio en prod).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/set-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}
