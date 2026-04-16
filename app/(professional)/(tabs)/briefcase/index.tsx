// Ruta: /(professional)/briefcase
// Mi Portafolio — el profesional ve su propio perfil público.
// Reutiliza ProfessionalBriefcaseScreen con modalityReadOnly=true.
//
// Los datos salen de Supabase vía useProfessionalProfile (usuario logueado)
// + useMyLocation (ubicación propia). Se construye un ProfessionalDetail
// para pasarle a la screen compartida.

import { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import type {
  ProfessionalDetail,
  ProfessionalAddress,
} from "@/features/professionals/types";
import { useProfessionalProfile } from "@/features/professionals/hooks/useProfessionalProfile";
import { useMyLocation } from "@/features/professionals/hooks/useMyLocation";
import { MiniLoader } from "@/shared/components";
import { colors } from "@/shared/theme";
import type { Professional as ProfessionalRow } from "@/shared/services/profileService";
import type { UserLocationAddress } from "@/shared/services/locationService";

export default function MyPortfolioScreen() {
  const { professional: row, isLoading: profileLoading } = useProfessionalProfile();
  const { location, isLoading: locationLoading }         = useMyLocation();

  const detail = useMemo<ProfessionalDetail | null>(() => {
    if (!row) return null;
    return mapRowToDetail(row, location);
  }, [row, location]);

  const isInitialLoading =
    (!row && profileLoading) || (!location && locationLoading);

  if (isInitialLoading) {
    return (
      <View style={styles.loaderWrap}>
        <MiniLoader />
      </View>
    );
  }

  if (!detail) return null;

  return (
    <ProfessionalBriefcaseScreen
      detail={detail}
      modalityReadOnly
      hideStats
      hideDistance
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPER — construye ProfessionalDetail desde el store del profesional logueado
// ─────────────────────────────────────────────────────────────────────────────

function mapRowToDetail(
  row: ProfessionalRow,
  location: UserLocationAddress | null,
): ProfessionalDetail {
  const address: ProfessionalAddress | null = location
    ? {
        street:     location.street,
        number:     location.number,
        floor:      null,
        apartment:  null,
        postalCode: location.postalCode,
        city:       location.city,
        province:   location.province,
        country:    location.country,
        lat:        location.lat,
        lng:        location.lng,
      }
    : null;

  return {
    id:                row.id,
    fullName:          row.full_name ?? "",
    category:          row.category ?? "",
    specialty:         row.specialty ?? null,
    subSpecialties:    row.sub_specialties ?? [],
    professionalArea:  row.professional_area ?? [],
    description:       row.description ?? null,
    quote:             row.quote ?? null,
    quoteAuthor:       row.quote_author ?? null,
    attendsOnline:     row.attends_online ?? false,
    attendsPresencial: row.attends_presencial ?? false,
    photoUrl:          row.photo_url ?? null,
    phone:             row.phone ?? null,
    socialWhatsapp:    row.social_whatsapp ?? null,
    socialInstagram:   row.social_instagram ?? null,
    socialLinkedin:    row.social_linkedin ?? null,
    socialTwitter:     row.social_twitter ?? null,
    socialTiktok:      row.social_tiktok ?? null,
    address,
  };
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
