// Route resolver centralizado.
// Mapea el rol del usuario a su ruta home (dentro del grupo de tabs).
//
// Un solo lugar para definir rutas por rol. Cuando se agreguen admin o web,
// se agrega una línea acá y todos los guards se actualizan automáticamente.
//
// ¿Por qué incluir (tabs) en la ruta?
//   Expo Router necesita saber que el home vive dentro del grupo (tabs),
//   no como screen directa del Stack. Sin (tabs) en el href, el Stack
//   renderiza el contenido sin el tab bar.

type UserRole = "client" | "professional";

const HOME_ROUTES: Record<UserRole, string> = {
  client:       "/(client)/(tabs)/home",
  professional: "/(professional)/(tabs)/home",
  // admin:     "/(admin)/(tabs)/dashboard",   ← futuro
  // web:       "/(web)/(tabs)/home",           ← futuro
};

const AUTH_ROUTES = {
  welcome:  "/(auth)/WelcomeScreen",
  role:     "/(auth)/UserTypeScreen",
  locationClient: "/(auth)/ClientLocationFormScreen",
  locationPro:    "/(auth)/ProfessionalFormScreen",
} as const;

/**
 * Dado el status de auth y el rol, devuelve la ruta a la que redirigir.
 * Retorna null solo si el status es "loading" (mostrar loader, no redirigir).
 */
export function resolveRoute(
  status: string,
  role?: string | null,
): string | null {
  if (status === "loading") return null;

  if (status === "unauthenticated") return AUTH_ROUTES.welcome;
  if (status === "needs-role")      return AUTH_ROUTES.role;

  if (status === "needs-location") {
    return role === "professional"
      ? AUTH_ROUTES.locationPro
      : AUTH_ROUTES.locationClient;
  }

  // authenticated — ir al home del rol
  const home = HOME_ROUTES[role as UserRole];
  if (home) return home;

  // Fallback: si el rol no matchea (dato corrupto), mandar a welcome
  return AUTH_ROUTES.welcome;
}

/**
 * Dado un rol, devuelve la ruta home (para el reverse guard del auth layout).
 */
export function getHomeRoute(role?: string | null): string {
  const home = HOME_ROUTES[role as UserRole];
  return home ?? AUTH_ROUTES.welcome;
}
