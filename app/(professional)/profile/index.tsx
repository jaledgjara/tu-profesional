// Ruta: /(professional)/profile
// Perfil del profesional — mismo screen que el cliente más el item "Editar mi perfil".

import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

import { ProfileScreen } from "@/features/profile/screens/ProfileScreen";
import { AppAlert } from "@/shared/components";
import { colors } from "@/shared/theme";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { strings } from "@/shared/utils/strings";

interface AlertState { visible: boolean; title: string; message: string; }
const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

export default function ProfessionalProfile() {
  const { signOut, loading } = useSignOut();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissError = useCallback(() => setErrorAlert(ALERT_HIDDEN), []);

  const handleConfirmLogout = async () => {
    setShowLogoutAlert(false);
    try {
      await signOut();
    } catch {
      setErrorAlert({ visible: true, title: strings.common.error, message: strings.auth.alertGenericMsg });
    }
  };

  return (
    <>
      <ProfileScreen
        variant="professional"
        onLogout={loading ? undefined : () => setShowLogoutAlert(true)}
        onEditProfile={() => {
          // TODO: navegar al formulario de edición cuando exista
        }}
      />
      <AppAlert
        visible={showLogoutAlert}
        icon={<Ionicons name="log-out-outline" size={28} color={colors.status.error} />}
        title={strings.proProfile.logoutAlertTitle}
        message={strings.proProfile.logoutAlertMessage}
        confirmLabel={strings.proProfile.logout}
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onDismiss={() => setShowLogoutAlert(false)}
      />
      <AppAlert
        visible={errorAlert.visible}
        icon={<Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />}
        title={errorAlert.title}
        message={errorAlert.message}
        dismissLabel={strings.auth.alertClose}
        onDismiss={dismissError}
      />
    </>
  );
}
