// Ruta: /(professional)/briefcase
// Mi Portafolio — el profesional ve su propio perfil público.
// Reutiliza ProfessionalBriefcaseScreen con showEditButton=true.
//
// Los datos salen de Supabase vía useProfessionalProfile (usuario logueado).
// Ratings, reseñas y distancia se ocultan: la vista propia no tiene sentido
// para esos campos y reviews todavía no existen en el schema.

import { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import type {
  BriefcaseAddress,
  SocialLinkData,
} from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import type { Professional } from "@/features/professionals/types";
import { useProfessionalProfile } from "@/features/professionals/hooks/useProfessionalProfile";
import { useMyLocation } from "@/features/professionals/hooks/useMyLocation";
import { MiniLoader } from "@/shared/components";
import { colors } from "@/shared/theme";
import type { Professional as ProfessionalRow } from "@/shared/services/profileService";
import type { UserLocationAddress } from "@/shared/services/locationService";

export default function MyPortfolioScreen() {
  const { professional: row, isLoading: profileLoading } = useProfessionalProfile();
  const { location, isLoading: locationLoading }         = useMyLocation();

  const professional = useMemo(() => (row ? mapRowToProfessional(row) : null), [row]);
  const socialLinks  = useMemo(() => (row ? buildSocialLinks(row) : []), [row]);
  const address      = useMemo(() => mapLocationToAddress(location), [location]);

  // Full-screen loader cuando:
  //   · No tenemos data aún Y alguno de los hooks está cargando (primer mount).
  //   · O cuando hay refresh activo y todavía no llegó la data nueva.
  // Si ya hay data y el refresh ronda en background, se muestra la última versión
  // y se actualiza in-place cuando llega — no parpadea con loader.
  const isInitialLoading =
    (!row && profileLoading) || (!location && locationLoading);

  if (isInitialLoading) {
    return (
      <View style={styles.loaderWrap}>
        <MiniLoader />
      </View>
    );
  }

  if (!row || !professional) return null;

  return (
    <ProfessionalBriefcaseScreen
      professional={professional}
      description={row.description ?? ""}
      quote={row.quote ?? ""}
      quoteAuthor={row.quote_author ?? ""}
      attendsOnline={row.attends_online}
      attendsPresencial={row.attends_presencial}
      modalityReadOnly
      address={address}
      reviews={[]}
      socialLinks={socialLinks}
      hideStats
      hideDistance
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS — snake_case DB → camelCase UI
// ─────────────────────────────────────────────────────────────────────────────

function mapRowToProfessional(row: ProfessionalRow): Professional {
  return {
    id:          row.id,
    name:        row.full_name ?? "",
    title:       titleFromCategory(row.category),
    specialty:   row.specialty ?? "",
    zone:        "", // La vista propia oculta ubicación con distancia; zona vendrá de user_locations más adelante.
    imageUrl:    row.photo_url ?? null,
    tags:        row.sub_specialties ?? [],
    // Campos sin DB — se ocultan con hideStats/hideDistance en la vista propia.
    rating:      0,
    reviewCount: 0,
    distanceM:   0,
    isAvailable: row.is_active ?? false,
    phone:       row.phone ?? "",
  };
}

function titleFromCategory(category: string | null | undefined): string {
  // Hoy solo existe `psychology`. Cuando se sumen categorías, mapearlas acá.
  if (category === "psychology") return "Psicólogo/a";
  return "";
}

function mapLocationToAddress(
  location: UserLocationAddress | null,
): BriefcaseAddress | null {
  if (!location) return null;
  return {
    street:   location.street,
    number:   location.number,
    city:     location.city,
    province: location.province,
    lat:      location.lat,
    lng:      location.lng,
  };
}

/**
 * Construye la lista de redes sociales que el profesional cargó en su perfil.
 * Solo se incluyen los campos con valor real (null o string vacío se omiten).
 * Orden: WhatsApp primero (el más accionable), después el resto en orden de
 * prioridad de contacto.
 */
function buildSocialLinks(row: ProfessionalRow): SocialLinkData[] {
  const links: SocialLinkData[] = [];

  const whatsapp  = row.social_whatsapp?.trim();
  const instagram = row.social_instagram?.trim();
  const linkedin  = row.social_linkedin?.trim();
  const twitter   = row.social_twitter?.trim();
  const tiktok    = row.social_tiktok?.trim();

  if (whatsapp) {
    const phone = whatsapp.replace(/\D/g, "");
    links.push({ type: "whatsapp", url: `whatsapp://send?phone=${phone}` });
  }
  if (instagram) {
    const handle = instagram.replace(/^@/, "");
    links.push({ type: "instagram", url: `https://instagram.com/${handle}` });
  }
  if (linkedin) {
    const url = linkedin.startsWith("http") ? linkedin : `https://${linkedin}`;
    links.push({ type: "linkedin", url });
  }
  if (twitter) {
    const handle = twitter.replace(/^@/, "");
    links.push({ type: "twitter", url: `https://twitter.com/${handle}` });
  }
  if (tiktok) {
    const handle = tiktok.replace(/^@/, "");
    links.push({ type: "tiktok", url: `https://www.tiktok.com/@${handle}` });
  }

  return links;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loaderWrap: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: colors.background.screen,
  },
});
