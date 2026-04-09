// useSaveProfessional — guarda todo el formulario del profesional
// Capa: features/auth/hooks
// Services: storageService.uploadProfessionalPhoto
//           profileService.createProfile (full_name + phone)
//           profileService.upsertProfessional (datos del pro)
//
// Coordina las 3 llamadas en una sola transacción lógica. Si la foto falla,
// no escribimos en la BD para no dejar al user con perfil sin foto a medias.
// Devuelve { saveProfessional, saving } — la screen solo arma el ProfessionalFormData.

import { useCallback, useState } from "react";

import {
  createProfile,
  upsertProfessional,
} from "@/shared/services/profileService";
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
}

export function useSaveProfessional() {
  const session = useAuthStore((s) => s.session);
  const [saving, setSaving] = useState(false);

  const saveProfessional = useCallback(
    async (data: ProfessionalFormData): Promise<void> => {
      if (!session) throw new Error("Tu sesión expiró. Iniciá sesión de nuevo.");
      setSaving(true);
      try {
        // 1. Subimos la foto primero. Si falla, no tocamos la BD.
        let photoUrl: string | null = null;
        if (data.photoUri) {
          photoUrl = await uploadProfessionalPhoto(session.user.id, data.photoUri);
        }

        // 2. Actualizamos profiles con full_name + phone (el role ya quedó en UserType).
        await createProfile({
          userId:   session.user.id,
          role:     "professional",
          fullName: data.fullName.trim(),
          phone:    data.phone.trim() || null,
        });

        // 3. Upsert de la fila professionals con todos los datos.
        await upsertProfessional(session.user.id, {
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
        });
      } finally {
        setSaving(false);
      }
    },
    [session],
  );

  return { saveProfessional, saving };
}
