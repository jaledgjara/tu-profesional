// useNotificationPrefs
// Capa: hook.
// Responsabilidad: cargar las preferencias de notificación, mantener estado
// local optimista, y persistir en Supabase Auth user_metadata.
//
// Patrón: optimistic update — al togglear, la UI cambia antes de que vuelva
// la respuesta. Si el save falla, revertimos. Esto da sensación de
// inmediatez en switches que la gente espera que sean instantáneos.

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from "@/shared/services/accountService";

interface UseNotificationPrefsResult {
  prefs:     NotificationPrefs;
  isLoading: boolean;
  isSaving:  boolean;
  toggle:    (key: keyof NotificationPrefs) => Promise<void>;
}

export function useNotificationPrefs(): UseNotificationPrefsResult {
  const [prefs, setPrefs]         = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNotificationPrefs()
      .then((p) => { if (!cancelled) setPrefs(p); })
      .catch((err) => console.error("[useNotificationPrefs] Error cargando prefs:", err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback(
    async (key: keyof NotificationPrefs) => {
      const prev = prefs;
      const next = { ...prefs, [key]: !prefs[key] };
      setPrefs(next);
      setIsSaving(true);
      try {
        await saveNotificationPrefs(next);
      } catch (err) {
        console.error("[useNotificationPrefs] Error guardando — revirtiendo:", err);
        setPrefs(prev);
      } finally {
        setIsSaving(false);
      }
    },
    [prefs],
  );

  return { prefs, isLoading, isSaving, toggle };
}
