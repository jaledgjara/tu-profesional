// AuthProvider — mantiene la sesión de Supabase disponible en todo el árbol.
// Al montar: hidrata con getSession(). Después escucha onAuthStateChange
// para reaccionar a login, logout, refresh de token y password recovery.
//
// Exponemos `isLoading` para que los guards esperen en lugar de tomar
// decisiones con datos incompletos (kickear al login cuando en verdad sí
// había sesión pero todavía no se hidrató).

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  getSession,
  onAuthStateChange,
  signOut as signOutService,
} from '@/features/auth/services/adminAuthService';
import { AuthContext, type AuthContextValue } from '@/app/providers/useSession';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]     = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSession()
      .then((initial) => {
        if (mounted) {
          setSession(initial);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
      });

    const subscription = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signOut: signOutService,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
