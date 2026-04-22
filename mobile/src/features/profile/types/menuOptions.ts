// Enums de los dos submenús del perfil:
//   · PrivacyMenuOption  → contenido legal (read-only, estático).
//   · AccountMenuOption  → acciones sobre la cuenta del profesional.
//
// Cada valor del enum matchea 1:1 con una screen bajo
// app/(professional)/settings/. El mismo valor se usa como `key` al iterar
// la lista y como segmento de ruta — mantener en sync.

export type PrivacyMenuOption = "terms" | "privacy" | "legal";

export type AccountMenuOption =
  | "faq"
  | "notifications"
  | "contact"
  | "delete-account";

export interface MenuEntry<T extends string> {
  key:         T;
  label:       string;
  description: string;
  icon:        IconName;
  destructive?: boolean;
}

// Subconjunto de Ionicons que usamos — evitamos el string genérico para que
// un typo en el icon name se detecte en compile-time.
export type IconName =
  | "document-text-outline"
  | "shield-checkmark-outline"
  | "library-outline"
  | "help-circle-outline"
  | "notifications-outline"
  | "chatbubbles-outline"
  | "trash-outline";

export const PRIVACY_MENU: ReadonlyArray<MenuEntry<PrivacyMenuOption>> = [
  {
    key:         "terms",
    label:       "Términos y Condiciones",
    description: "Reglas de uso de la plataforma",
    icon:        "document-text-outline",
  },
  {
    key:         "privacy",
    label:       "Política de Privacidad",
    description: "Cómo tratamos tus datos",
    icon:        "shield-checkmark-outline",
  },
  {
    key:         "legal",
    label:       "Avisos Legales",
    description: "Responsabilidad y jurisdicción",
    icon:        "library-outline",
  },
] as const;

export const ACCOUNT_MENU: ReadonlyArray<MenuEntry<AccountMenuOption>> = [
  {
    key:         "faq",
    label:       "Preguntas Frecuentes",
    description: "Respuestas rápidas a dudas comunes",
    icon:        "help-circle-outline",
  },
  {
    key:         "notifications",
    label:       "Notificaciones",
    description: "Elegí qué avisos querés recibir",
    icon:        "notifications-outline",
  },
  {
    key:         "contact",
    label:       "Contactar al equipo",
    description: "Escribinos — respondemos en 24hs",
    icon:        "chatbubbles-outline",
  },
  {
    key:         "delete-account",
    label:       "Eliminar cuenta",
    description: "Borra tu perfil y todos tus datos",
    icon:        "trash-outline",
    destructive: true,
  },
] as const;
