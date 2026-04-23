// Guard: además de sesión, exige que profiles.role sea 'admin'.
// Si no lo es: signOut + redirect a /login con un error genérico.
// No revelamos "no sos admin" — eso sería leak de información.
//
// Importante: esto es UX. Aunque un atacante bypassee el guard editando el
// bundle, las RLS de Postgres niegan todo lo que no sea lectura pública.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { useSession } from '@/app/providers/useSession';
import { useAdminProfile } from '@/features/auth/hooks/useAdminProfile';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';

export function RequireAdmin() {
  const { signOut } = useSession();
  const { data: profile, isLoading, isError } = useAdminProfile();
  const location = useLocation();

  // Si hay error de red o el profile no existe tras la hidratación,
  // cerramos sesión para no dejar el usuario en un estado ambiguo.
  useEffect(() => {
    if (isLoading) return;
    if (!profile || profile.role !== 'admin') {
      // fire-and-forget: el redirect de abajo se encarga de la UI.
      signOut().catch(() => {});
    }
  }, [isLoading, profile, signOut]);

  if (isLoading) return <PageLoader />;

  if (isError || !profile || profile.role !== 'admin') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, error: 'Credenciales inválidas.' }}
      />
    );
  }

  return <Outlet />;
}
