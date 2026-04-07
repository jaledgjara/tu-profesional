// Hook: useProfessionalDetail
// Capa: hook
// Carga los detalles extendidos de un profesional por su id.
// TODO: reemplazar con query a Supabase cuando el schema esté listo.

import { useMemo } from "react";
import type { Professional } from "@/features/professionals/types";
import type {
  ReviewData,
  SocialLinkData,
} from "@/features/professionals/screens/ProfessionalBriefcaseScreen";

interface ProfessionalDetailResult {
  professional:     Professional | null;
  yearsExperience:  number;
  description:      string;
  quote:            string;
  quoteAuthor:      string;
  reviews:          ReviewData[];
  socialLinks:      SocialLinkData[];
  isLoading:        boolean;
  error:            Error | null;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROFESSIONALS: Record<string, Professional> = {
  "1": {
    id:          "1",
    name:        "Lic. Valentina Morales",
    title:       "Psicóloga clínica",
    specialty:   "Terapia Cognitivo-Conductual",
    zone:        "Godoy Cruz, Mendoza",
    imageUrl:    null,
    tags:        ["ADULTOS", "TCC", "ONLINE", "PAREJA"],
    rating:      4.9,
    reviewCount: 38,
    distanceM:   2400,
    isAvailable: true,
    phone:       "5492614001234",
  },
  "2": {
    id:          "2",
    name:        "Lic. Martín Suárez",
    title:       "Psicólogo clínico",
    specialty:   "Psicoanálisis",
    zone:        "Ciudad, Mendoza",
    imageUrl:    null,
    tags:        ["ADULTOS", "ADOLESCENTES", "PRESENCIAL"],
    rating:      4.7,
    reviewCount: 22,
    distanceM:   4800,
    isAvailable: false,
    phone:       "5492614005678",
  },
};

const MOCK_REVIEWS: Record<string, ReviewData[]> = {
  "1": [
    {
      id:          "r1",
      rating:      5,
      text:        "Valentina me ayudó muchísimo a gestionar mi ansiedad. Su enfoque es cálido y profesional a la vez.",
      authorName:  "Ana García",
      dateString:  "2025-12-15",
    },
    {
      id:          "r2",
      rating:      5,
      text:        "Muy buena profesional. Me sentí escuchada desde la primera sesión. La recomiendo ampliamente.",
      authorName:  "Laura M.",
      dateString:  "2025-11-28",
    },
    {
      id:          "r3",
      rating:      4,
      text:        "Excelente manejo de herramientas TCC. Noté cambios reales en pocas semanas de trabajo.",
      authorName:  "Rodrigo P.",
      dateString:  "2025-10-10",
    },
  ],
};

const MOCK_SOCIAL_LINKS: Record<string, SocialLinkData[]> = {
  "1": [
    { type: "whatsapp",  url: "whatsapp://send?phone=5492614001234" },
    { type: "instagram", url: "https://instagram.com" },
  ],
};

const MOCK_EXTRAS: Record<string, {
  yearsExperience: number;
  description:     string;
  quote:           string;
  quoteAuthor:     string;
}> = {
  "1": {
    yearsExperience: 8,
    description:
      "Soy psicóloga clínica especializada en Terapia Cognitivo-Conductual con más de 8 años de experiencia. Trabajo con adultos en problemáticas de ansiedad, depresión, vínculos y tránsitos vitales. Mi enfoque es colaborativo: construimos juntos las herramientas que necesitás.",
    quote:       "La terapia no te cambia la vida. Te enseña a vivirla.",
    quoteAuthor: "Irvin Yalom",
  },
  "2": {
    yearsExperience: 12,
    description:
      "Psicólogo clínico con formación psicoanalítica. Atiendo adultos y adolescentes en procesos de autoconocimiento, conflictos relacionales y bienestar emocional.",
    quote:       "",
    quoteAuthor: "",
  },
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProfessionalDetail(id: string | undefined): ProfessionalDetailResult {
  return useMemo(() => {
    if (!id) {
      return {
        professional:    null,
        yearsExperience: 0,
        description:     "",
        quote:           "",
        quoteAuthor:     "",
        reviews:         [],
        socialLinks:     [],
        isLoading:       false,
        error:           null,
      };
    }

    const professional = MOCK_PROFESSIONALS[id] ?? null;
    const extras       = MOCK_EXTRAS[id];
    const reviews      = MOCK_REVIEWS[id] ?? [];
    const socialLinks  = MOCK_SOCIAL_LINKS[id] ?? [];

    return {
      professional,
      yearsExperience: extras?.yearsExperience ?? 0,
      description:     extras?.description     ?? "",
      quote:           extras?.quote           ?? "",
      quoteAuthor:     extras?.quoteAuthor     ?? "",
      reviews,
      socialLinks,
      isLoading: false,
      error:     null,
    };
  }, [id]);
}
