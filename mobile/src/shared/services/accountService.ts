// accountService — operaciones sobre la cuenta del usuario logueado.
// Capa: shared/services (funciones puras, sin React).
//
// Por qué vive en shared/ y no en features/auth/:
//   estas operaciones afectan a client y professional por igual; no son de
//   auth per se (auth ya lo resuelve authService) sino de "ciclo de vida"
//   de la cuenta. Esta distinción es importante porque delete-account va a
//   requerir borrar datos del rol (professional row + foto de Storage).
//
// Estado actual:
//   · deleteAccount → STUB: por ahora sólo hace signOut. La baja real
//     requiere una Edge Function con service role (no se puede borrar un
//     auth.user desde el cliente). Queda pendiente como TODO.
//   · saveNotificationPrefs → persiste en user_metadata de Supabase Auth.
//     No creamos una tabla dedicada todavía; las preferencias son ligeras.

import { supabase } from "@/shared/services/supabase";
import { signOut } from "@/shared/services/authService";

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationPrefs {
  platformUpdates: boolean;
  billing:         boolean;
  tips:            boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  platformUpdates: true,
  billing:         true,
  tips:            false,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[accountService::getNotificationPrefs] Error →", error.message);
    throw error;
  }
  const stored = data.user?.user_metadata?.notification_prefs as
    | Partial<NotificationPrefs>
    | undefined;
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(stored ?? {}) };
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  console.log("[accountService::saveNotificationPrefs] Guardando prefs:", prefs);
  const { error } = await supabase.auth.updateUser({
    data: { notification_prefs: prefs },
  });
  if (error) {
    console.error("[accountService::saveNotificationPrefs] Error →", error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────
//
// TODO(backend): implementar Edge Function `delete-account` que:
//   1. Valide el JWT del usuario.
//   2. Borre la foto de Storage (professional-photos/{user_id}).
//   3. Borre la fila de `professionals` (ON DELETE CASCADE limpia subs).
//   4. Borre la fila de `profiles`.
//   5. Llame supabase.auth.admin.deleteUser(userId) con service role.
//   6. Devuelva 204 si todo OK.
//
// Por ahora hacemos sign-out local y avisamos al usuario que un operador
// completará la baja. No queremos mentir sobre el estado: mejor pedir
// confirmación por email que simular una baja inmediata que no ocurrió.

export async function deleteAccount(): Promise<void> {
  console.warn(
    "[accountService::deleteAccount] STUB — Edge Function pendiente. " +
    "Hacemos signOut local; el borrado de datos se completa offline.",
  );
  // TODO: await supabase.functions.invoke("delete-account", { body: {} });
  await signOut();
}
