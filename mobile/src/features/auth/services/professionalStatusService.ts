// professionalStatusService — consulta el estado de aprobación del profesional
// logueado. Se usa en la pantalla post-onboarding para mostrar pending /
// approved / rejected.
//
// Capa: service (función pura, sin React). No abre sesión: asume que el caller
// ya está autenticado como profesional (lo llama un hook que lee authStore).

import { supabase } from "@/shared/services/supabase";

export type ProfessionalStatus = "pending" | "approved" | "rejected";

export interface ProfessionalStatusResult {
  status:           ProfessionalStatus;
  rejectionReason:  string | null;
  reviewedAt:       string | null;
}

export async function getMyProfessionalStatus(
  userId: string,
): Promise<ProfessionalStatusResult | null> {
  const { data, error } = await supabase
    .from("professionals")
    .select("status, rejection_reason, reviewed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    status:          data.status as ProfessionalStatus,
    rejectionReason: data.rejection_reason,
    reviewedAt:      data.reviewed_at,
  };
}
