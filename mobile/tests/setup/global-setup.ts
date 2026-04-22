// Global setup para Vitest — se ejecuta UNA VEZ antes de todos los tests.
// Verifica que Supabase local esté corriendo.

import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export async function setup() {
  const url = process.env.SUPABASE_URL || "http://127.0.0.1:54321";

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY || "",
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase respondió con status ${res.status}`);
    }

    console.log("\n✓ Supabase local está corriendo\n");
  } catch (err) {
    // No fallar: los tests unitarios (store/) no necesitan Supabase.
    // Los integration tests fallarán individualmente si Supabase no está corriendo.
    console.warn(
      "\n⚠ Supabase local no está corriendo.",
      "\n  Los tests de integración van a fallar.",
      "\n  Levantalo con: supabase start",
      "\n  Error:",
      (err as Error).message,
      "\n"
    );
    process.env.SUPABASE_NOT_RUNNING = "true";
  }
}

export async function teardown() {
  // No cleanup global necesario — cada test limpia sus propios datos
}
