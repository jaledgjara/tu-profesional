// Cliente Supabase para admin-web — singleton.
//
// Diferencias con mobile:
//   - `localStorage` por default (no AsyncStorage — eso es RN-only).
//   - `detectSessionInUrl: true` — al volver de un link de invite o reset
//     password, Supabase parsea el hash y levanta la sesión "recovery".
//   - Env vars con prefijo VITE_ (Vite sólo expone al cliente lo que tenga
//     ese prefijo; mismo URL y anon key que mobile, son públicos).

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/database.types';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en admin-web/.env.local. ' +
    'Copiá .env.example → .env.local y completá los valores.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
  },
});
