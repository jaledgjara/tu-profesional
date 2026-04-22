// Ruta: /(professional)/settings/privacy/privacy
// Política de Privacidad — renderiza PRIVACY_DOCUMENT vía LegalTextScreen.

import React from "react";
import { LegalTextScreen } from "@/features/profile/screens/LegalTextScreen";
import { PRIVACY_DOCUMENT } from "@/features/profile/content/legal";

export default function PrivacyPolicyScreen() {
  return <LegalTextScreen document={PRIVACY_DOCUMENT} />;
}
