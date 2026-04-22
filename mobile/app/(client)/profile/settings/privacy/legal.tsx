import React from "react";
import { LegalTextScreen } from "@/features/profile/screens/LegalTextScreen";
import { LEGAL_DOCUMENT } from "@/features/profile/content/legal";

export default function LegalScreen() {
  return <LegalTextScreen document={LEGAL_DOCUMENT} />;
}
