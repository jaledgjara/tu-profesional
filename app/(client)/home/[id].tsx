// Ruta: /(client)/home/[id]
// Perfil público de un profesional visto por el usuario final.
// Parámetros: id (string) — usado para cargar datos del profesional.

import { useRouter, useLocalSearchParams } from "expo-router";

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import { useProfessionalDetail } from "@/features/professionals/hooks/useProfessionalDetail";

export default function ClientProfessionalProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    professional,
    description,
    quote,
    quoteAuthor,
    reviews,
    socialLinks,
  } = useProfessionalDetail(id);

  if (!professional) return null;

  return (
    <ProfessionalBriefcaseScreen
      professional={professional}
      description={description}
      quote={quote}
      quoteAuthor={quoteAuthor}
      reviews={reviews}
      socialLinks={socialLinks}
      showBackButton
      onBack={() => router.back()}
    />
  );
}
