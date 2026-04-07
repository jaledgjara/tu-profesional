// Screen: ProfessionalBriefcaseScreen
// Capa: screen (silly view)
// Clientes: usuario final (showBackButton=true) y profesional (showEditButton=true)
// Reutilizable en: /(client)/home/[id], /(client)/search/[id], /(professional)/briefcase

import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Avatar,
  Badge,
  InfoSection,
  SectionRow,
  IconButton,
} from "@/shared/components";
import { StatsRow }   from "@/features/professionals/components/StatsRow";
import { ReviewCard } from "@/features/professionals/components/ReviewCard";
import type { Professional } from "@/features/professionals/types";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings, interpolate } from "@/shared/utils/strings";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewData {
  id:            string;
  rating:        number;
  text:          string;
  authorName:    string;
  authorImageUrl?: string | null;
  dateString:    string;
}

export interface SocialLinkData {
  type: "whatsapp" | "instagram" | "facebook" | "linkedin";
  url:  string;
}

export interface ProfessionalBriefcaseScreenProps {
  professional:       Professional;
  yearsExperience?:   number;
  description?:       string;
  quote?:             string;
  quoteAuthor?:       string;
  reviews?:           ReviewData[];
  socialLinks?:       SocialLinkData[];
  showBackButton?:    boolean;
  showEditButton?:    boolean;
  onBack?:            () => void;
  onEdit?:            () => void;
  onSeeAllReviews?:   () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DE REDES SOCIALES
// ─────────────────────────────────────────────────────────────────────────────

const SOCIAL_CONFIG: Record<
  SocialLinkData["type"],
  { iconName: IoniconName; label: string; iconColor: string; bgColor: string }
> = {
  whatsapp:  { iconName: "logo-whatsapp",  label: "WhatsApp",  iconColor: "#25D366", bgColor: "#E8FAF0" },
  instagram: { iconName: "logo-instagram", label: "Instagram", iconColor: "#E4405F", bgColor: "#FDE8ED" },
  facebook:  { iconName: "logo-facebook",  label: "Facebook",  iconColor: "#1877F2", bgColor: "#E8F1FE" },
  linkedin:  { iconName: "logo-linkedin",  label: "LinkedIn",  iconColor: "#0A66C2", bgColor: "#E7F0FA" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export function ProfessionalBriefcaseScreen({
  professional,
  yearsExperience,
  description,
  quote,
  quoteAuthor,
  reviews = [],
  socialLinks = [],
  showBackButton  = false,
  showEditButton  = false,
  onBack,
  onEdit,
  onSeeAllReviews,
}: ProfessionalBriefcaseScreenProps) {
  const distanceKm = (professional.distanceM / 1000).toFixed(1);

  const stats = [
    {
      value: `★ ${professional.rating.toFixed(1)}`,
      label: strings.publicProfile.rating,
    },
    {
      value: professional.reviewCount,
      label: strings.publicProfile.reviews_label,
    },
    ...(yearsExperience !== undefined
      ? [{ value: yearsExperience, label: strings.publicProfile.experience }]
      : []),
  ];

  const handleSocialPress = (link: SocialLinkData) => {
    Alert.alert(
      strings.publicProfile.leaveAppTitle,
      strings.publicProfile.leaveAppDesc,
      [
        { text: strings.common.cancel, style: "cancel" },
        {
          text:    strings.publicProfile.leaveAppConfirm,
          onPress: () => Linking.openURL(link.url),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <AppHeader
        variant="blue"
        leftAction={
          showBackButton && onBack ? (
            <IconButton
              icon={
                <Ionicons
                  name="arrow-back"
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
              accessibilityLabel={strings.proProfile.edit}
            >
              <Text style={styles.editLabel}>{strings.proProfile.edit}</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* ── HERO (azul) — avatar + nombre + especialidad + distancia ──── */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <Avatar
            imageUrl={professional.imageUrl}
            name={professional.name}
            size="xl"
            showVerifiedBadge
          />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{professional.name}</Text>
            <Text style={styles.heroTitle}>{professional.title}</Text>
            <Text style={styles.heroSpecialty}>{professional.specialty}</Text>
            {professional.distanceM > 0 && (
              <Text style={styles.heroDistance}>
                {interpolate(strings.card.distanceFormat, { distance: distanceKm })}{" "}
                {strings.publicProfile.distance}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ── STATS ROW — overlap sobre hero ──────────────────────────────── */}
      <View style={styles.statsWrapper}>
        <StatsRow stats={stats} />
      </View>

      {/* ── SCROLL — contenido debajo del hero ──────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* SOBRE MÍ */}
        {(quote || description) && (
          <InfoSection title={strings.publicProfile.aboutMe}>
            {quote ? (
              <>
                <Text style={styles.quoteText}>"{quote}"</Text>
                {quoteAuthor ? (
                  <Text style={styles.quoteAuthor}>— {quoteAuthor}</Text>
                ) : null}
                {description ? <View style={styles.quoteDivider} /> : null}
              </>
            ) : null}
            {description ? (
              <Text style={styles.descriptionText}>{description}</Text>
            ) : null}
          </InfoSection>
        )}

        {/* ESPECIALIDADES */}
        {professional.tags.length > 0 && (
          <InfoSection title={strings.publicProfile.specialties}>
            <View style={styles.tagsRow}>
              {professional.tags.map((tag) => (
                <Badge key={tag} label={tag} variant="tag" />
              ))}
            </View>
          </InfoSection>
        )}

        {/* RESEÑAS */}
        {reviews.length > 0 && (
          <View style={styles.reviewsBlock}>
            <SectionRow
              title={strings.publicProfile.reviews}
              actionLabel={
                onSeeAllReviews ? strings.publicProfile.seeAllReviews : undefined
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
                accessibilityRole="button"
              >
                <Text style={styles.seeAllLabel}>
                  {strings.publicProfile.seeAllReviews}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* REDES SOCIALES */}
        {socialLinks.length > 0 && (
          <InfoSection title={strings.publicProfile.socialNetworks}>
            <View style={styles.socialRow}>
              {socialLinks.map((link) => {
                const config = SOCIAL_CONFIG[link.type];
                return (
                  <Pressable
                    key={link.type}
                    onPress={() => handleSocialPress(link)}
                    style={({ pressed }) => [
                      styles.socialBtn,
                      { backgroundColor: config.bgColor, opacity: pressed ? 0.7 : 1 },
                      getShadow("sm"),
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={config.label}
                  >
                    <Ionicons
                      name={config.iconName}
                      size={28}
                      color={config.iconColor}
                    />
                    <Text style={[styles.socialLabel, { color: config.iconColor }]}>
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </InfoSection>
        )}

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: colors.background.screen,
  },

  // Hero (azul)
  hero: {
    backgroundColor:   colors.palette.blue700,
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[12], // espacio para el overlap de StatsRow
  },
  heroInner: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           spacing[4],
  },
  heroText: {
    flex: 1,
    gap:  spacing[1],
  },
  heroName: {
    ...typography.h2,
    color: colors.text.inverse,
  },
  heroTitle: {
    ...typography.bodyMd,
    color:   colors.text.inverse,
    opacity: 0.85,
  },
  heroSpecialty: {
    ...typography.caption,
    color:         colors.text.inverse,
    opacity:       0.7,
    textTransform: "uppercase",
  },
  heroDistance: {
    ...typography.caption,
    color:   colors.text.inverse,
    opacity: 0.65,
    marginTop: spacing[1],
  },

  // Stats (overlap)
  statsWrapper: {
    marginHorizontal: spacing[4],
    marginTop:        -spacing[8],
  },

  editLabel: {
    ...typography.buttonSm,
    color: colors.text.inverse,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[10],
    gap:               spacing[4],
  },

  // Sobre mí
  quoteText: {
    ...typography.bodyMd,
    color:      colors.text.secondary,
    fontStyle:  "italic",
    lineHeight: 24,
  },
  quoteAuthor: {
    ...typography.caption,
    color:     colors.text.tertiary,
    marginTop: spacing[1],
  },
  quoteDivider: {
    height:          1,
    backgroundColor: colors.border.subtle,
    marginVertical:  spacing[3],
  },
  descriptionText: {
    ...typography.bodyMd,
    color:      colors.text.primary,
    lineHeight: 24,
  },

  // Especialidades
  tagsRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing[2],
  },

  // Reseñas
  reviewsBlock: {
    gap: spacing[3],
  },
  reviewsList: {
    gap: spacing[3],
  },
  seeAllBtn: {
    backgroundColor:   colors.background.card,
    borderRadius:      componentRadius.button,
    paddingVertical:   spacing[3],
    alignItems:        "center",
    justifyContent:    "center",
    minHeight:         44,
  },
  seeAllLabel: {
    ...typography.buttonMd,
    color: colors.text.brand,
  },

  // Redes sociales
  socialRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing[3],
  },
  socialBtn: {
    flex:            1,
    minWidth:        "40%",
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             spacing[2],
    borderRadius:    componentRadius.card,
    paddingVertical: spacing[3],
    minHeight:       44,
  },
  socialLabel: {
    ...typography.buttonSm,
  },
});
