// Screen: AllReviewsScreen
// Capa: feature screen (reviews)
// Ruta: app/(client)/(tabs)/home/[id]/reviews.tsx
//
// Lista completa de reseñas anónimas de un profesional. Paginada (offset)
// vía `useProfessionalReviews` con batches de 20. Empty state cuando el pro
// no recibió ninguna reseña.
//
// Header de la FlatList: título + badge con avg rating (reusa el mismo
// componente visual que el perfil, para coherencia).

import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppHeader, IconButton, MiniLoader } from "@/shared/components";
import { ReviewCard } from "@/features/professionals/components/ReviewCard";
import { useProfessionalReviews } from "@/features/reviews/hooks/useProfessionalReviews";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings, interpolate } from "@/shared/utils/strings";

interface AllReviewsScreenProps {
  professionalId: string;
  onBack?:        () => void;
}

const PAGE_SIZE = 20;

export const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({
  professionalId,
  onBack,
}) => {
  const {
    reviews,
    stats,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
  } = useProfessionalReviews(professionalId, { limit: PAGE_SIZE });

  const hasRating        = !!stats && stats.reviewCount > 0;
  const isInitialLoading = isLoading && reviews.length === 0;
  const reviewCount      = stats?.reviewCount ?? 0;
  const reviewCountLabel =
    reviewCount === 1
      ? strings.reviews.countOne
      : interpolate(strings.reviews.count, { n: reviewCount });

  return (
    <View style={styles.screen}>
      <AppHeader
        variant="blue"
        titleAlign="left"
        leftAction={
          onBack ? (
            <IconButton
              icon={
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={colors.text.inverse}
                />
              }
              onPress={onBack}
              variant="default"
            />
          ) : undefined
        }
        title={strings.reviews.allReviewsTitle}
      />

      {isInitialLoading ? (
        <MiniLoader label={strings.common.loading} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View style={[styles.ratingBadge, getShadow("sm")]}>
                {hasRating ? (
                  <Text style={styles.ratingValue}>
                    {stats!.avgRating.toFixed(1)}
                  </Text>
                ) : (
                  <Text style={styles.ratingNuevo}>
                    {strings.publicProfile.newPro}
                  </Text>
                )}
                <MaterialCommunityIcons
                  name="star"
                  size={32}
                  color={colors.text.primary}
                />
                {hasRating && (
                  <Text style={styles.ratingCount}>
                    {reviewCountLabel}
                  </Text>
                )}
              </View>
              <View style={styles.divider} />
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ReviewCard
                rating={item.rating}
                comment={item.comment}
                dateString={item.createdAt}
              />
            </View>
          )}
          ListEmptyComponent={
            !error ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={48}
                  color={colors.text.tertiary}
                />
                <Text style={styles.emptyTitle}>
                  {strings.reviews.emptyTitle}
                </Text>
                <Text style={styles.emptyDesc}>
                  {strings.reviews.emptyDesc}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.brand.primary} />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: colors.background.screen,
  },

  // Header block (dentro de la FlatList)
  headerBlock: {
    alignItems: "center",
    paddingTop: spacing[4],
  },
  ratingBadge: {
    minWidth:          104,
    minHeight:         96,
    backgroundColor:   colors.background.card,
    borderRadius:      componentRadius.statsRow,
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[3],
    alignItems:        "center",
    justifyContent:    "center",
    gap:               spacing[1.5],
  },
  ratingValue: {
    ...typography.statValue,
    color: colors.text.primary,
  },
  ratingNuevo: {
    ...typography.overline,
    color:         colors.text.primary,
    textTransform: "uppercase",
  },
  // Count bajo la estrella — informativo (sin underline, no es link acá)
  ratingCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  divider: {
    alignSelf:       "stretch",
    height:          1,
    backgroundColor: colors.border.subtle,
    marginTop:       spacing[4],
  },

  // List
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom:     spacing[10],
  },
  cardWrap: {
    marginTop: spacing[3],
  },

  // Empty
  empty: {
    alignItems:        "center",
    paddingVertical:   spacing[8],
    paddingHorizontal: spacing[5],
    gap:               spacing[3],
    backgroundColor:   colors.background.card,
    borderRadius:      componentRadius.card,
    marginTop:         spacing[4],
    ...getShadow("sm"),
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptyDesc: {
    ...typography.bodyMd,
    color:     colors.text.secondary,
    textAlign: "center",
  },

  // Loader
  footer: {
    paddingVertical: spacing[4],
    alignItems:      "center",
  },
});
