// profileService — CRUD de profiles + professionals
// Capa: shared/services
// Funciones puras tipadas con Database. Las consumen el authStore y las
// pantallas de onboarding (UserTypeScreen, ProfessionalFormScreen).
//
// Inyección de cliente:
//   Cada función acepta un SupabaseClient opcional como último parámetro.
//   En producción no se pasa — se usa el singleton `supabase`.
//   En tests se pasa un cliente autenticado contra Supabase local para
//   ejecutar las RLS policies con un JWT real.

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/shared/services/supabase";
import type { Database } from "@/shared/types/database";

export type Profile      = Database["public"]["Tables"]["profiles"]["Row"];
export type Professional = Database["public"]["Tables"]["professionals"]["Row"];
export type UserRole     = Profile["role"]; // 'client' | 'professional'

type ProfessionalUpsert = Database["public"]["Tables"]["professionals"]["Insert"];

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────────────────────────────────────

/** Devuelve el profile del user. `null` si todavía no eligió rol. */
export async function getProfile(
  userId: string,
  client: SupabaseClient = supabase,
): Promise<Profile | null> {
  console.log("[profileService::getProfile] Consultando profile — userId:", userId);
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[profileService::getProfile] Error de Supabase →", error.message);
    throw error;
  }
  if (data) {
    console.log("[profileService::getProfile] Profile encontrado — rol:", data.role);
  } else {
    console.log("[profileService::getProfile] Profile no encontrado — el user aún no eligió rol.");
  }
  return data;
}

export async function createProfile(
  input: {
    userId: string;
    role:   UserRole;
    email:  string;
  },
  client: SupabaseClient = supabase,
): Promise<Profile> {
  console.log("[profileService::createProfile] Upsert de profile — userId:", input.userId, "| rol:", input.role, "| email:", input.email);
  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        id:    input.userId,
        role:   input.role,
        email:  input.email,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (error) {
    console.error("[profileService::createProfile] Error de Supabase →", error.message);
    throw error;
  }
  console.log("[profileService::createProfile] Profile guardado correctamente — id:", data.id);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONALS
// ─────────────────────────────────────────────────────────────────────────────

export async function getProfessional(
  userId: string,
  client: SupabaseClient = supabase,
): Promise<Professional | null> {
  console.log("[profileService::getProfessional] Consultando fila professionals — userId:", userId);
  const { data, error } = await client
    .from("professionals")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[profileService::getProfessional] Error de Supabase →", error.message);
    throw error;
  }
  if (data) {
    console.log("[profileService::getProfessional] Profesional encontrado — especialidad:", data.specialty ?? "(sin especialidad)", "| activo:", data.is_active);
  } else {
    console.log("[profileService::getProfessional] Fila de profesional no encontrada aún.");
  }
  return data;
}

/**
 * Crea o actualiza la fila del profesional.
 * Asume que ya existe un `profiles` con role='professional' (FK lo exige).
 */
export async function upsertProfessional(
  userId: string,
  data: Omit<ProfessionalUpsert, "id">,
  client: SupabaseClient = supabase,
): Promise<Professional> {
  console.log("[profileService::upsertProfessional] Upsert de profesional — userId:", userId, "| especialidad:", data.specialty ?? "(sin especialidad)", "| online:", data.attends_online, "| presencial:", data.attends_presencial);
  const { data: row, error } = await client
    .from("professionals")
    .upsert({ id: userId, ...data }, { onConflict: "id" })
    .select()
    .single();
  if (error) {
    console.error("[profileService::upsertProfessional] Error de Supabase →", error.message);
    throw error;
  }
  console.log("[profileService::upsertProfessional] Profesional guardado — id:", row.id, "| photo_url:", row.photo_url ?? "(sin foto)");
  return row;
}
