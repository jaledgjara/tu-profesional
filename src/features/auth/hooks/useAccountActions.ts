// useAccountActions
// Capa: hook (orquesta service + estado local + store de auth).
//
// Expone acciones de alto nivel que las screens consumen sin preocuparse
// por loading/error plumbing. Por eso las screens quedan "silly views".
//
// Acciones:
//   · deleteAccount()      → borra cuenta y resetea auth store.
//   · openContactWhatsApp()→ deeplink a WhatsApp con el número del equipo.
//   · openContactEmail()   → mailto: con el email del equipo.
//
// Notification prefs tienen su propio hook (useNotificationPrefs) para no
// mezclar lifecycle de fetch-then-edit con acciones one-shot.

import { useCallback, useState } from "react";
import { Linking } from "react-native";

import { useAuthStore } from "@/features/auth/store/authStore";
import { strings } from "@/shared/utils/strings";

interface UseAccountActionsResult {
  isDeleting: boolean;
  deleteAccount:        () => Promise<void>;
  openContactWhatsApp:  () => Promise<void>;
  openContactEmail:     () => Promise<void>;
}

export function useAccountActions(): UseAccountActionsResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const authSignOut = useAuthStore((s) => s.signOut);

  const deleteAccount = useCallback(async () => {
    // TODO(backend): invocar Edge Function `delete-account`. Mientras tanto,
    // el authStore.signOut limpia sesión + stores de profile/location.
    setIsDeleting(true);
    try {
      await authSignOut();
    } finally {
      setIsDeleting(false);
    }
  }, [authSignOut]);

  const openContactWhatsApp = useCallback(async () => {
    const raw = strings.contact.whatsappNumber.replace(/[^\d]/g, "");
    const url = `https://wa.me/${raw}`;
    await Linking.openURL(url);
  }, []);

  const openContactEmail = useCallback(async () => {
    const url = `mailto:${strings.contact.emailAddress}`;
    await Linking.openURL(url);
  }, []);

  return { isDeleting, deleteAccount, openContactWhatsApp, openContactEmail };
}
