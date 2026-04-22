// Ruta: /(professional)/settings/privacy/legal
// Avisos Legales — renderiza LEGAL_DOCUMENT vía LegalTextScreen.

import React from "react";
import { LegalTextScreen } from "@/features/profile/screens/LegalTextScreen";
import { LEGAL_DOCUMENT } from "@/features/profile/content/legal";

export default function LegalNoticesScreen() {
  return <LegalTextScreen document={LEGAL_DOCUMENT} />;
}
