// Auth guard del root — centraliza TODA la lógica de routing.
//
// Patrón: las screens de auth hacen `router.replace('/')` al terminar su paso.
// Este guard recalcula el destino via resolveRoute() y redirige.
//
// Las rutas se resuelven en routeResolver.ts — un solo lugar para todos los
// roles (client, professional, y futuros admin/web).

import { Redirect } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { MiniLoader } from "@/shared/components";
import { resolveRoute } from "@/shared/utils/routeResolver";

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.profile?.role ?? null);

  const href = resolveRoute(status, role);

  console.log("[guard] status:", status, "| rol:", role ?? "—", "| →", href ?? "loading");

  if (!href) return <MiniLoader />;

  return <Redirect href={href} />;
}
