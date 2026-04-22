// Ruta: /(auth)/ProfessionalFormScreen
// Onboarding del profesional — primer alta de su fila en `professionals`.
// Al guardar, navega directo al siguiente paso (ubicación). NO pasa por el
// guard (`router.replace('/')`) porque éste devolvería acá hasta que haya
// ubicación, generando un loop visible.
//
// Toda la UI vive en ProfessionalForm. Acá sólo:
//   - instancia el hook useSaveProfessional
//   - cablea el onSubmit
//   - maneja el alert de error

import { useCallback, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ProfessionalForm } from "@/features/professionals/components/ProfessionalForm";
import { AppAlert } from "@/shared/components";
import { colors } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import {
  useSaveProfessional,
  type ProfessionalFormData,
} from "@/features/auth/hooks/useSaveProfessional";

interface AlertState { visible: boolean; title: string; message: string; }
const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

export default function ProfessionalFormScreen() {
  const { saveProfessional, saving } = useSaveProfessional();
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  const handleSubmit = useCallback(
    async (data: ProfessionalFormData) => {
      try {
        await saveProfessional(data);
        router.replace("/(auth)/ProfessionalLocationFormScreen");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
        setAlert({
          visible: true,
          title:   strings.auth.alertProfessionalErrorTitle,
          message: msg,
        });
      }
    },
    [saveProfessional],
  );

  return (
    <>
      <ProfessionalForm
        onSubmit={handleSubmit}
        submitLabel={strings.proSetup.saveCta}
        submittingLabel="Guardando..."
        isSubmitting={saving}
        onBack={() => router.back()}
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
