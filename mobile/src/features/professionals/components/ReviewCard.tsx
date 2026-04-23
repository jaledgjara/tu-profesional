// Component: ReviewCard
// Capa: feature component (professionals)
//
// Card anónima de reseña. Cambio respecto a la versión previa:
//   - Se quitó authorName, authorImageUrl, Avatar. La reseña NO muestra
//     al autor — el anonimato es una garantía del producto (salud mental:
//     estigma de consultar). Lo garantiza la vista reviews_public en DB
//     (no expone reviewer_id); acá reforzamos en UI.
//   - El campo `text` pasó a `comment: string | null`. Si es null, no se
//     renderiza el párrafo (el usuario eligió calificar sin texto).
//   - Las estrellas ahora usan StarRating (componente reutilizable).

import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { StarRating } from "@/features/reviews/components/StarRating";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { formatReviewDate } from "@/shared/utils/format";

interface ReviewCardProps {
  rating:     number;          // 1-5 (validado en DB)
  comment:    string | null;   // null si el autor calificó sin texto
  dateString: string;          // ISO timestamp — formatReviewDate lo humaniza
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  rating,
  comment,
  dateString,
}) => (
  <View style={[styles.card, getShadow("sm")]}>
    <View style={styles.header}>
      <StarRating value={rating} size={16} readOnly />
      <Text style={[typography.caption, { color: colors.text.tertiary }]}>
        {formatReviewDate(dateString).toUpperCase()}
      </Text>
    </View>

    {comment !== null && comment.length > 0 && (
      <Text
        style={[
          typography.bodyMd,
          { color: colors.text.primary, fontStyle: "italic" },
        ]}>
        &ldquo;{comment}&rdquo;
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.reviewCard,
    padding:         spacing[4],
    gap:             spacing[3],
  },
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
});
