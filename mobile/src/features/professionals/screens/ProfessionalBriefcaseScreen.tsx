// Screen: ProfessionalBriefcaseScreen
// Capa: screen (silly view)
// Clientes: usuario final (showBackButton=true) y profesional (showEditButton=true)
// Reutilizable en: /(client)/home/[id], /(client)/search/[id], /(professional)/briefcase

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import {
  AppHeader,
  Avatar,
  Badge,
  InfoSection,
  SectionRow,
  IconButton,
  Switch,
} from "@/shared/components";
import { StatsRow } from "@/features/professionals/components/StatsRow";
import { ReviewCard } from "@/features/professionals/components/ReviewCard";
import type { ProfessionalDetail } from "@/features/professionals/types";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { formatCategory } from "@/shared/utils/format";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewData {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  authorImageUrl?: string | null;
  dateString: string;
}

export type SocialLinkType =
  | "whatsapp"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "tiktok";

export interface SocialLinkData {
  type: SocialLinkType;
  url: string;
}

/** Dirección que se muestra en la sección Ubicación. Viene de user_locations. */
export interface BriefcaseAddress {
  street?:   string | null;
  number?:   string | null;
  city?:     string | null;
  province?: string | null;
  /** Coordenadas para centrar el mapa. Si faltan, se cae al placeholder. */
  lat?:      number | null;
  lng?:      number | null;
}

export interface ProfessionalBriefcaseScreenProps {
  /** Datos completos del profesional (de fetchProfessionalDetail o construido localmente). */
  detail: ProfessionalDetail;
  /** Reseñas del profesional. Cuando exista el sistema de reviews, vendrán del hook. */
  reviews?: ReviewData[];
  /**
   * Si es `true`, los toggles de modalidad son informativos (no editables).
   * La edición va por el formulario de profesional, no por el briefcase.
   */
  modalityReadOnly?: boolean;
  /** Oculta la StatsRow (rating/reseñas) cuando no hay datos reales. */
  hideStats?: boolean;
  /** Oculta la pill de distancia (útil en la vista propia del profesional). */
  hideDistance?: boolean;
  showBackButton?: boolean;
  showEditButton?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  onSeeAllReviews?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DE REDES SOCIALES
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** "Calle 123, Ciudad, Provincia" — filtra vacíos y arma la línea de dirección. */
function buildAddressLine(address?: BriefcaseAddress | null): string {
  if (!address) return "";
  const street =
    address.street && address.number
      ? `${address.street} ${address.number}`
      : address.street ?? "";
  const parts = [street, address.city, address.province]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  return parts.join(", ");
}

// Alineado con las columnas `social_*` del schema (sin facebook — no existe en DB).
// `renderIcon` en lugar de `iconName` porque mezclamos icon sets: Ionicons para
// casi todo, FontAwesome6 para el logo de X (Ionicons solo trae el pájaro viejo).
interface SocialConfigEntry {
  label:     string;
  iconColor: string;
  bgColor:   string;
  renderIcon: (size: number, color: string) => ReactNode;
}

const ionIcon = (name: IoniconName) =>
  (size: number, color: string) => (
    <Ionicons name={name} size={size} color={color} />
  );

const SOCIAL_CONFIG: Record<SocialLinkType, SocialConfigEntry> = {
  whatsapp: {
    label:      "WhatsApp",
    iconColor:  "#25D366",
    bgColor:    "#E8FAF0",
    renderIcon: ionIcon("logo-whatsapp"),
  },
  instagram: {
    label:      "Instagram",
    iconColor:  "#E4405F",
    bgColor:    "#FDE8ED",
    renderIcon: ionIcon("logo-instagram"),
  },
  linkedin: {
    label:      "LinkedIn",
    iconColor:  "#0A66C2",
    bgColor:    "#E7F0FA",
    renderIcon: ionIcon("logo-linkedin"),
  },
  twitter: {
    label:      "X",
    iconColor:  "#000000",
    bgColor:    "#F2F2F2",
    // Icono oficial de X via FontAwesome6 — Ionicons solo tiene el pájaro clásico.
    renderIcon: (size, color) => (
      <FontAwesome6 name="x-twitter" size={size} color={color} />
    ),
  },
  tiktok: {
    label:      "TikTok",
    iconColor:  "#000000",
    bgColor:    "#F2F2F2",
    renderIcon: ionIcon("logo-tiktok"),
  },
};

/**
 * Construye la lista de redes sociales desde los campos social_* del detail.
 * Solo incluye los que tienen valor (null o vacío se omiten).
 * WhatsApp primero (el más accionable).
 */
function buildSocialLinksFromDetail(d: ProfessionalDetail): SocialLinkData[] {
  const links: SocialLinkData[] = [];

  const whatsapp  = d.socialWhatsapp?.trim();
  const instagram = d.socialInstagram?.trim();
  const linkedin  = d.socialLinkedin?.trim();
  const twitter   = d.socialTwitter?.trim();
  const tiktok    = d.socialTiktok?.trim();

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
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export function ProfessionalBriefcaseScreen({
  detail,
  reviews = [],
  modalityReadOnly = false,
  hideStats = false,
  hideDistance = false,
  showBackButton = false,
  showEditButton = false,
  onBack,
  onEdit,
  onSeeAllReviews,
}: ProfessionalBriefcaseScreenProps) {
  const distanceKm = detail.distanceM
    ? (detail.distanceM / 1000).toFixed(1)
    : null;

  // Los switches reflejan los flags del profesional (attends_online / attends_presencial).
  // Por ahora son visuales: la persistencia se hace desde el formulario de edición.
  const [worksOnline, setWorksOnline] = useState<boolean>(detail.attendsOnline);
  const [worksInPerson, setWorksInPerson] = useState<boolean>(detail.attendsPresencial);

  useEffect(() => {
    setWorksOnline(detail.attendsOnline);
  }, [detail.attendsOnline]);

  useEffect(() => {
    setWorksInPerson(detail.attendsPresencial);
  }, [detail.attendsPresencial]);

  // Stats — ocultas hasta que exista el sistema de reseñas
  const stats = hideStats ? [] : [];

  // Dirección para el mapa
  const address: BriefcaseAddress | null = detail.address
    ? {
        street:   detail.address.street,
        number:   detail.address.number,
        city:     detail.address.city,
        province: detail.address.province,
        lat:      detail.address.lat,
        lng:      detail.address.lng,
      }
    : null;

  const addressLine = buildAddressLine(address) || detail.address?.city || "";

  // Redes sociales — construidas desde los campos social_* del detail
  const socialLinks = buildSocialLinksFromDetail(detail);

  const handleSocialPress = (link: SocialLinkData) => {
    Alert.alert(
      strings.publicProfile.leaveAppTitle,
      strings.publicProfile.leaveAppDesc,
      [
        { text: strings.common.cancel, style: "cancel" },
        {
          text: strings.publicProfile.leaveAppConfirm,
          onPress: () => Linking.openURL(link.url),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* ── HEADER 56pt fijo — unificado con el resto de la app ─────────── */}
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          showBackButton && onBack ? (
            <IconButton
              icon={
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.text.inverse}
                />
              }
              onPress={onBack}
              variant="default"
            />
          ) : undefined
        }
        rightAction={
          showEditButton && onEdit ? (
            <Pressable
              onPress={onEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={strings.proProfile.edit}>
              <Text style={styles.editLabel}>{strings.proProfile.edit}</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* ── HERO (azul) — avatar centrado + nombre + especialidad ──── */}
      <View style={styles.hero}>
        <Avatar
          imageUrl={detail.photoUrl}
          name={detail.fullName}
          size="xxl"
          rounded
          showVerifiedBadge
        />
        <Text style={styles.heroName}>{detail.fullName}</Text>
        {detail.category ? (
          <Text style={styles.heroTitle}>{formatCategory(detail.category)}</Text>
        ) : null}
        {detail.specialty ? (
          <Text style={styles.heroSpecialty}>{detail.specialty}</Text>
        ) : null}
      </View>

      {/* ── STATS ROW — overlap sobre hero ──────────────────────────────── */}
      {stats.length > 0 && (
        <View style={styles.statsWrapper}>
          <StatsRow stats={stats} />
        </View>
      )}

      {/* ── SECCIONES — contenido debajo del hero/stats ─────────────────── */}
      <View
        style={[
          styles.sections,
          stats.length === 0 && styles.sectionsNoStats,
        ]}
      >
        {/* UBICACIÓN + MAPA */}
        <InfoSection title="Ubicación">
          <View style={styles.mapArea}>
            {address?.lat != null && address?.lng != null ? (
              <MapView
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFill}
                initialRegion={{
                  latitude:       address.lat,
                  longitude:      address.lng,
                  // ~300 metros de zoom — alcanza para ver calles + comercios
                  // a la redonda sin perder el contexto de la zona.
                  latitudeDelta:  0.004,
                  longitudeDelta: 0.004,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
                showsPointsOfInterest
                showsBuildings
                showsCompass={false}
              >
                <Marker
                  coordinate={{ latitude: address.lat, longitude: address.lng }}
                  anchor={{ x: 0.5, y: 1 }}
                />
              </MapView>
            ) : (
              // Fallback decorativo cuando todavía no hay coordenadas
              // (ej. usuario sin ubicación cargada, o la RPC aún no respondió).
              <>
                <View style={styles.mapGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={`h-${i}`}
                      style={[styles.mapGridLineH, { top: `${(i + 1) * 14}%` }]}
                    />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={`v-${i}`}
                      style={[styles.mapGridLineV, { left: `${(i + 1) * 14}%` }]}
                    />
                  ))}
                </View>
                <View style={styles.mapPin}>
                  <Ionicons
                    name="location"
                    size={36}
                    color={colors.brand.primary}
                  />
                </View>
              </>
            )}
          </View>

          {addressLine ? (
            <View style={styles.mapMetaRow}>
              <View style={styles.mapMetaLeft}>
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.mapZone} numberOfLines={2}>
                  {addressLine}
                </Text>
              </View>
              {!hideDistance && distanceKm && (
                <View style={styles.mapDistancePill}>
                  <Text style={styles.mapDistanceText}>{distanceKm} km</Text>
                </View>
              )}
            </View>
          ) : null}
        </InfoSection>

        {/* SOBRE MÍ */}
        {(detail.quote || detail.description) && (
          <InfoSection title={strings.publicProfile.aboutMe}>
            {detail.quote ? (
              <>
                <Text style={styles.quoteText}>"{detail.quote}"</Text>
                {detail.quoteAuthor ? (
                  <Text style={styles.quoteAuthor}>— {detail.quoteAuthor}</Text>
                ) : null}
                {detail.description ? <View style={styles.quoteDivider} /> : null}
              </>
            ) : null}
            {detail.description ? (
              <Text style={styles.descriptionText}>{detail.description}</Text>
            ) : null}
          </InfoSection>
        )}

        {/* ESPECIALIDADES */}
        {detail.subSpecialties.length > 0 && (
          <InfoSection title={strings.publicProfile.specialties}>
            <View style={styles.tagsRow}>
              {detail.subSpecialties.map((tag) => (
                <Badge key={tag} label={tag} variant="tag" />
              ))}
            </View>
          </InfoSection>
        )}

        {/* MODALIDAD DE TRABAJO */}
        <InfoSection title="Modalidad de trabajo">
          <View style={styles.modalityRow}>
            <View style={styles.modalityLeft}>
              <View style={styles.modalityIcon}>
                <Ionicons
                  name="videocam-outline"
                  size={18}
                  color={colors.brand.primary}
                />
              </View>
              <Text style={styles.modalityLabel}>Trabajo online</Text>
            </View>
            <Switch
              value={worksOnline}
              onValueChange={setWorksOnline}
              readOnly={modalityReadOnly}
              accessibilityLabel="Trabajo online"
            />
          </View>

          <View style={styles.modalityDivider} />

          <View style={styles.modalityRow}>
            <View style={styles.modalityLeft}>
              <View style={styles.modalityIcon}>
                <Ionicons
                  name="home-outline"
                  size={18}
                  color={colors.brand.primary}
                />
              </View>
              <Text style={styles.modalityLabel}>Trabajo presencial</Text>
            </View>
            <Switch
              value={worksInPerson}
              onValueChange={setWorksInPerson}
              readOnly={modalityReadOnly}
              accessibilityLabel="Trabajo presencial"
            />
          </View>
        </InfoSection>

        {/* RESEÑAS */}
        {reviews.length > 0 && (
          <View style={styles.reviewsBlock}>
            <SectionRow
              title={strings.publicProfile.reviews}
              actionLabel={
                onSeeAllReviews
                  ? strings.publicProfile.seeAllReviews
                  : undefined
              }
              onAction={onSeeAllReviews}
            />
            <View style={styles.reviewsList}>
              {reviews.slice(0, 3).map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  text={review.text}
                  authorName={review.authorName}
                  authorImageUrl={review.authorImageUrl}
                  dateString={review.dateString}
                />
              ))}
            </View>
            {onSeeAllReviews && reviews.length > 3 && (
              <Pressable
                onPress={onSeeAllReviews}
                style={[styles.seeAllBtn, getShadow("sm")]}
                accessibilityRole="button">
                <Text style={styles.seeAllLabel}>
                  {strings.publicProfile.seeAllReviews}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* REDES SOCIALES — solo las que el profesional cargó en su perfil */}
        {socialLinks.length > 0 && (
          <InfoSection title={strings.publicProfile.socialNetworks}>
            <FlatList
              data={socialLinks}
              keyExtractor={(link) => link.type}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.socialListContent}
              ItemSeparatorComponent={() => <View style={styles.socialSeparator} />}
              renderItem={({ item }) => {
                const config = SOCIAL_CONFIG[item.type];
                return (
                  <Pressable
                    onPress={() => handleSocialPress(item)}
                    style={({ pressed }) => [
                      styles.socialCard,
                      {
                        backgroundColor: config.bgColor,
                        opacity: pressed ? 0.7 : 1,
                      },
                      getShadow("sm"),
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={config.label}>
                    {config.renderIcon(24, config.iconColor)}
                    <Text
                      style={[styles.socialLabel, { color: config.iconColor }]}
                      numberOfLines={1}>
                      {config.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </InfoSection>
        )}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },

  // Hero (azul)
  hero: {
    backgroundColor: colors.palette.blue700,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[12], // espacio para el overlap de StatsRow
    alignItems: "center",
    gap: spacing[2],
  },
  heroName: {
    ...typography.h2,
    color: colors.text.inverse,
    marginTop: spacing[1],
    textAlign: "center",
  },
  heroTitle: {
    ...typography.bodyMd,
    color: colors.text.inverse,
    opacity: 0.85,
    textAlign: "center",
  },
  heroSpecialty: {
    ...typography.caption,
    color: colors.text.inverse,
    opacity: 0.7,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // Stats (overlap)
  statsWrapper: {
    marginHorizontal: spacing[4],
    marginTop: -spacing[8],
  },

  editLabel: {
    ...typography.buttonSm,
    color: colors.text.inverse,
  },

  // Scroll
  scrollContent: {
    paddingBottom: spacing[10],
  },
  sections: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    gap: spacing[4],
  },
  // Cuando no se renderiza StatsRow, el hero pierde el overlap y hay que
  // recuperar el respiro vertical hacia las secciones.
  sectionsNoStats: {
    paddingTop: spacing[8],
  },

  // Sobre mí
  quoteText: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    fontStyle: "italic",
    lineHeight: 24,
  },
  quoteAuthor: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  quoteDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[3],
  },
  descriptionText: {
    ...typography.bodyMd,
    color: colors.text.primary,
    lineHeight: 24,
  },

  // Especialidades
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },

  // Modalidad de trabajo
  modalityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
  },
  modalityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  modalityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalityLabel: {
    ...typography.bodyMd,
    color: colors.text.primary,
  },
  modalityDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[1],
  },

  // Ubicación / Mapa
  mapArea: {
    height: 220,
    backgroundColor: colors.palette.blue50,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    borderColor: colors.border.brand,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.palette.blue100,
  },
  mapGridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.palette.blue100,
  },
  mapPin: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background.card,
    alignItems: "center",
    justifyContent: "center",
    ...getShadow("sm"),
  },
  mapMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[3],
    gap: spacing[3],
  },
  mapMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    flex: 1,
  },
  mapZone: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
  },
  mapDistancePill: {
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: componentRadius.badge,
  },
  mapDistanceText: {
    ...typography.buttonSm,
    color: colors.brand.primary,
  },

  // Reseñas
  reviewsBlock: {
    gap: spacing[3],
  },
  reviewsList: {
    gap: spacing[3],
  },
  seeAllBtn: {
    backgroundColor: colors.background.card,
    borderRadius: componentRadius.button,
    paddingVertical: spacing[3],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  seeAllLabel: {
    ...typography.buttonMd,
    color: colors.text.brand,
  },

  // Redes sociales — FlatList horizontal con cards compactos
  socialListContent: {
    paddingVertical: spacing[1],
  },
  socialSeparator: {
    width: spacing[3],
  },
  socialCard: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    gap:               spacing[2],
    borderRadius:      componentRadius.card,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    minHeight:         44,
    minWidth:          140,
  },
  socialLabel: {
    ...typography.buttonSm,
  },
});
