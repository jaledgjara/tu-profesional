// Cliente Supabase — singleton
// Capa: shared/services
// Importan: features/auth, features/profile, features/professional-setup, features/location
//
// ¿Por qué singleton?
//   Una sola instancia evita múltiples websockets, refresh tokens duplicados,
//   y garantiza que todos los services hablen con la misma sesión.
//
// ¿Por qué AsyncStorage?
//   Supabase guarda el JWT (access + refresh token) acá para persistir la sesión
//   entre cierres de la app. Es el storage recomendado por la doc oficial para RN.
//   No usamos SecureStore porque tiene cap de 2KB y los JWT pueden superarlo.

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@shared/database.types";

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en el .env. " +
    "Reiniciá Metro con `npx expo start --dev-client --clear` después de completarlas."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,  // refresca el JWT antes de que expire
    persistSession:     true,  // guarda en AsyncStorage
    detectSessionInUrl: false, // off: no estamos en web
  },
});
