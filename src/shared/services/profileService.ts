// profileService — CRUD de profiles + professionals
// Capa: shared/services
// Funciones puras tipadas con Database. Las consumen el authStore y las
// pantallas de onboarding (UserTypeScreen, ProfessionalFormScreen).

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
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(input: {
  userId:    string;
  role:      UserRole;
  fullName?: string | null;
  phone?:    string | null;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id:        input.userId,
        role:      input.role,
        full_name: input.fullName ?? null,
        phone:     input.phone ?? null,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONALS
// ─────────────────────────────────────────────────────────────────────────────

export async function getProfessional(userId: string): Promise<Professional | null> {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Crea o actualiza la fila del profesional.
 * Asume que ya existe un `profiles` con role='professional' (FK lo exige).
 */
export async function upsertProfessional(
  userId: string,
  data: Omit<ProfessionalUpsert, "id">,
): Promise<Professional> {
  const { data: row, error } = await supabase
    .from("professionals")
    .upsert({ id: userId, ...data }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return row;
}
