// Hook + contexto de sesión. Vive en su propio archivo (separado de
// AuthProvider) porque Fast Refresh exige que cada archivo exporte sólo
// componentes — mezclar hook/contexto con el componente provider rompe HMR.

import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextValue {
  session:   Session | null;
  isLoading: boolean;
  signOut:   () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useSession debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
