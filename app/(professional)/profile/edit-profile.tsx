// Ruta: /(professional)/profile/edit-profile
// Edición del perfil del profesional — reutiliza ProfessionalForm con los
// datos ya cargados desde Supabase. Al guardar, hace upsert y vuelve al perfil.
//
// Diferencias con el onboarding (ProfessionalFormScreen):
//   - initialValues ← fila real de `professionals`
//   - La foto se reusa si no cambió (useSaveProfessional detecta URL http y no
//     la re-sube).
//   - Navegación: `router.back()` en vez de ir al siguiente paso de onboarding.

import { useCallback, useMemo, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { AppAlert, MiniLoader } from "@/shared/components";
import { colors } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useProfessionalProfile } from "@/features/professionals/hooks/useProfessionalProfile";
import {
  useSaveProfessional,
  type ProfessionalFormData,
} from "@/features/auth/hooks/useSaveProfessional";
import type { Professional as ProfessionalRow } from "@/shared/services/profileService";

interface AlertState { visible: boolean; title: string; message: string; }
const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

export default function EditProfileScreen() {
  const { professional, isLoading, refetch } = useProfessionalProfile();
  const { saveProfessional, saving }         = useSaveProfessional();

  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  const initialValues = useMemo<Partial<ProfessionalFormData> | undefined>(
    () => (professional ? mapRowToFormData(professional) : undefined),
    [professional],
  );

  const handleSubmit = useCallback(
    async (data: ProfessionalFormData) => {
      try {
        await saveProfessional(data);
        // Refrescamos el hook para que el briefcase/home vean los datos nuevos.
        await refetch();
        router.back();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
        setAlert({
          visible: true,
          title:   strings.auth.alertProfessionalErrorTitle,
          message: msg,
        });
      }
    },
    [saveProfessional, refetch],
  );

  // Loading: no renderizamos el form hasta tener `initialValues` para evitar
  // un flash con todos los campos vacíos.
  if (isLoading && !professional) {
    return <MiniLoader />;
  }

  return (
    <>
      <ProfessionalForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Guardar cambios"
        submittingLabel="Guardando..."
        isSubmitting={saving}
        lockPersonalInfo
        onBack={() => router.back()}
        title="Editar Perfil"
        compactFooter
      />
      <AppAlert
        visible={alert.visible}
        icon={<Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />}
        title={alert.title}
        message={alert.message}
        dismissLabel={strings.auth.alertClose}
        onDismiss={dismissAlert}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPER — fila DB (snake_case) → ProfessionalFormData (camelCase)
// ─────────────────────────────────────────────────────────────────────────────

function mapRowToFormData(row: ProfessionalRow): Partial<ProfessionalFormData> {
  return {
    photoUri:          row.photo_url ?? null,
    category:          row.category ?? "",
    fullName:          row.full_name ?? "",
    dni:               row.dni ?? "",
    phone:             row.phone ?? "",
    license:           row.license ?? "",
    description:       row.description ?? "",
    quote:             row.quote ?? "",
    quoteAuthor:       row.quote_author ?? "",
    specialty:         row.specialty ?? "",
    subSpecialties:    row.sub_specialties ?? [],
    attendsOnline:     row.attends_online ?? false,
    attendsPresencial: row.attends_presencial ?? false,
    socialWhatsapp:    row.social_whatsapp ?? "",
    socialInstagram:   row.social_instagram ?? "",
    socialLinkedin:    row.social_linkedin ?? "",
    socialTwitter:     row.social_twitter ?? "",
    socialTiktok:      row.social_tiktok ?? "",
  };
}
