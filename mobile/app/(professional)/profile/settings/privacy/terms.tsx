// Ruta: /(professional)/settings/privacy/terms
// Términos y Condiciones — renderiza TERMS_DOCUMENT vía LegalTextScreen.

import React from "react";
import { LegalTextScreen } from "@/features/profile/screens/LegalTextScreen";
import { TERMS_DOCUMENT } from "@/features/profile/content/legal";

export default function TermsScreen() {
  return <LegalTextScreen document={TERMS_DOCUMENT} />;
}
