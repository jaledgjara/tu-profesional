// Ruta: /(professional)/briefcase
// Mi Portafolio — el profesional ve su propio perfil público.
// Reutiliza ProfessionalBriefcaseScreen con showEditButton=true.
// TODO: reemplazar id hardcodeado por el id del usuario autenticado.

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import { useProfessionalDetail } from "@/features/professionals/hooks/useProfessionalDetail";
import { ScrollView } from "react-native";

export default function MyPortfolioScreen() {
  // TODO: obtener id desde el contexto de auth
  const {
    professional,
    yearsExperience,
    description,
    quote,
    quoteAuthor,
    reviews,
    socialLinks,
  } = useProfessionalDetail("1");

  if (!professional) return null;

  return (
    <ProfessionalBriefcaseScreen
      professional={professional}
      yearsExperience={yearsExperience}
      description={description}
      quote={quote}
      quoteAuthor={quoteAuthor}
      reviews={reviews}
      socialLinks={socialLinks}
    />
  );
}
