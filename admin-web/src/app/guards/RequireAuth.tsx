// Guard: requiere que haya sesión de Supabase. Sin sesión → redirect a /login,
// guardando la ruta intentada en state.from para hacer bounce-back después
// del login exitoso.
//
// Esto es UX, no seguridad. La seguridad real vive en las RLS de Postgres.

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSession } from '@/app/providers/useSession';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';

export function RequireAuth() {
  const { session, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
