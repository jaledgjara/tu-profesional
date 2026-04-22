// Mocks reutilizables de dependencias de React Native que los services
// importan transitivamente vía `@/shared/services/supabase`.
//
// Sin estos mocks, importar cualquier service en Node explota porque:
//   - `react-native-url-polyfill/auto` intenta modificar globals de RN
//   - `@react-native-async-storage/async-storage` requiere el bridge nativo
//   - `@/shared/services/supabase` necesita ambos para inicializar el cliente
//
// Cómo usar en un test:
//
//   import "../setup/mock-rn-deps";   // ← primer import, antes que cualquier service
//   import { getProfile } from "@/shared/services/profileService";
//
// Vitest hoistea los vi.mock al top del archivo automáticamente, así que el
// orden de imports no importa — pero igual lo ponemos primero por claridad.

import { vi } from "vitest";

// react-native-url-polyfill/auto ejecuta side effects. En Node no necesitamos
// el polyfill (URL ya está nativo).
vi.mock("react-native-url-polyfill/auto", () => ({}));

// AsyncStorage: la instancia singleton que el cliente Supabase usa para
// persistir la sesión. En tests no queremos persistencia, devolvemos un
// storage en memoria trivial.
vi.mock("@react-native-async-storage/async-storage", () => {
  const memoryStore = new Map<string, string>();
  return {
    default: {
      getItem:    (key: string) => Promise.resolve(memoryStore.get(key) ?? null),
      setItem:    (key: string, value: string) => {
        memoryStore.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
        return Promise.resolve();
      },
      clear:      () => {
        memoryStore.clear();
        return Promise.resolve();
      },
    },
  };
});

// `@/shared/services/supabase` exporta el cliente singleton. En tests no lo
// usamos — cada test pasa un `authenticatedClient` explícito como param a las
// funciones del service. Exportamos un stub que lanza si alguien lo usa sin
// querer (así detectamos tests que olvidan pasar el cliente).
vi.mock("@/shared/services/supabase", () => ({
  supabase: new Proxy({}, {
    get() {
      throw new Error(
        "[mock-rn-deps] supabase singleton fue usado en un test. " +
        "Pasá un SupabaseClient explícito como último param del service."
      );
    },
  }),
}));
