// Ruta: /(client)/search/[id]
// Perfil público de un profesional accedido desde búsqueda o categoría.
// router.back() vuelve a CategoryProfesionalScreen o search/index.

import { useRouter, useLocalSearchParams } from "expo-router";

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import { useProfessionalDetail }       from "@/features/professionals/hooks/useProfessionalDetail";

export default function SearchProfessionalProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { professional, description, quote, quoteAuthor, reviews, socialLinks } =
    useProfessionalDetail(id);

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
