// useSaveProfessional — guarda todo el formulario del profesional
// Capa: features/auth/hooks
// Services: storageService.uploadProfessionalPhoto
//           profileService.upsertProfessional (datos del pro, incluyendo full_name y phone)
//
// Coordina las 2 llamadas en una sola transacción lógica. Si la foto falla,
// no escribimos en la BD para no dejar al user con perfil sin foto a medias.
// Devuelve { saveProfessional, saving } — la screen solo arma el ProfessionalFormData.

import { useCallback, useState } from "react";

import { upsertProfessional } from "@/shared/services/profileService";
import { uploadProfessionalPhoto } from "@/shared/services/storageService";
import { useAuthStore } from "@/features/auth/store/authStore";

export interface ProfessionalFormData {
  photoUri:           string | null;
  category:           string;
  fullName:           string;
  dni:                string;
  phone:              string;
  license:            string;
  description:        string;
  quote:              string;
  quoteAuthor:        string;
  specialty:          string;
  subSpecialties:     string[];
  attendsOnline:      boolean;
  attendsPresencial:  boolean;
  socialWhatsapp:     string;
  socialInstagram:    string;
  socialLinkedin:     string;
  socialTwitter:      string;
  socialTiktok:       string;
}

export function useSaveProfessional() {
  const session = useAuthStore((s) => s.session);
  const [saving, setSaving] = useState(false);

  const saveProfessional = useCallback(
    async (data: ProfessionalFormData): Promise<void> => {
      if (!session) {
        console.error("[useSaveProfessional] Sin sesión activa — no se puede guardar el profesional.");
        throw new Error("Tu sesión expiró. Iniciá sesión de nuevo.");
      }
      console.log("[useSaveProfessional] Iniciando guardado del formulario profesional — userId:", session.user.id, "| nombre:", data.fullName, "| especialidad:", data.specialty);
      setSaving(true);
      try {
        // 1. Subimos la foto primero. Si falla, no tocamos la BD.
        let photoUrl: string | null = null;
        if (data.photoUri) {
          console.log("[useSaveProfessional] [1/2] Subiendo foto a Storage…");
          photoUrl = await uploadProfessionalPhoto(session.user.id, data.photoUri);
          console.log("[useSaveProfessional] [1/2] Foto subida →", photoUrl);
        } else {
          console.log("[useSaveProfessional] [1/2] Sin foto seleccionada — se omite el upload.");
        }

        // 2. Upsert de la fila professionals con todos los datos (incluyendo full_name y phone).
        console.log("[useSaveProfessional] [2/2] Upsert de fila professionals…");
        await upsertProfessional(session.user.id, {
          full_name:          data.fullName.trim(),
          phone:              data.phone.trim() || null,
          category:           data.category,
          dni:                data.dni.trim() || null,
          license:            data.license.trim() || null,
          description:        data.description.trim() || null,
          quote:              data.quote.trim() || null,
          quote_author:       data.quoteAuthor.trim() || null,
          specialty:          data.specialty.trim() || null,
          sub_specialties:    data.subSpecialties,
          attends_online:     data.attendsOnline,
          attends_presencial: data.attendsPresencial,
          photo_url:          photoUrl,
          is_active:          true,
          social_whatsapp:    data.socialWhatsapp.trim() || null,
          social_instagram:   data.socialInstagram.trim() || null,
          social_linkedin:    data.socialLinkedin.trim() || null,
          social_twitter:     data.socialTwitter.trim() || null,
          social_tiktok:      data.socialTiktok.trim() || null,
        });
        console.log("[useSaveProfessional] [2/2] Profesional guardado. Las 2 operaciones completadas con éxito.");
      } finally {
        setSaving(false);
      }
    },
    [session],
  );

  return { saveProfessional, saving };
}
