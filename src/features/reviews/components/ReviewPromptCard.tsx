// Component: ReviewPromptCard
// Capa: feature component (reviews)
//
// Card que va debajo de "Redes sociales" en el perfil del profesional.
// Dos estados mutuamente excluyentes:
//
//   1. Form — el cliente no dejó reseña todavía:
//      ┌──────────────────────────────────────────┐
//      │ Dejá tu valoración                       │
//      │    ★ ★ ★ ☆ ☆                             │
//      │    [textarea opcional]                   │
//      │    [ Agregar valoración ]                │
//      └──────────────────────────────────────────┘
//
//   2. Thanks — el cliente ya reseñó:
//      ┌──────────────────────────────────────────┐
//      │ Gracias por colaborar                    │
//      │              ✓ (check verde)             │
//      │    Tu valoración ya fue registrada.      │
//      └──────────────────────────────────────────┘
//
// El hook `useSubmitReview` vive en la route (no acá). Este componente solo
// llama a `onSubmit` y muestra Alerts en caso de error.

import React, { useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Button, TextInput, InfoSection } from "@/shared/components";
import { StarRating } from "@/features/reviews/components/StarRating";
import { colors, typography, spacing } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

const COMMENT_MAX = 1000;

interface ReviewPromptCardProps {
  /** true si ya dejó reseña → muestra el estado "gracias". */
  hasMyReview:  boolean;
  /** Submit del form. Devuelve { ok, message? } para que la card haga el Alert. */
  onSubmit:     (
    rating:  number,
    comment: string | null,
  ) => Promise<{ ok: boolean; message?: string }>;
  isSubmitting: boolean;
  /**
   * Navegación a la pantalla de edición. Solo relevante cuando
   * `hasMyReview=true`. Si no se pasa, no se muestra el botón.
   */
  onEdit?:      () => void;
}

export const ReviewPromptCard: React.FC<ReviewPromptCardProps> = ({
  hasMyReview,
  onSubmit,
  isSubmitting,
  onEdit,
}) => {
  // ── Estado "ya reseñó" — muestra el agradecimiento + CTA de edición ──
  if (hasMyReview) {
    return (
      <InfoSection title={strings.reviews.thanksTitle}>
        <View style={styles.thanksBody}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons
              name="check-bold"
              size={28}
              color={colors.text.inverse}
            />
          </View>
          <Text style={styles.thanksDesc}>
            {strings.reviews.thanksDesc}
          </Text>
          {onEdit && (
            <Button
              label={strings.reviews.editCta}
              variant="outline"
              onPress={onEdit}
              fullWidth
            />
          )}
        </View>
      </InfoSection>
    );
  }

  // ── Estado form — editable ──────────────────────────────────────────
  return <ReviewPromptForm onSubmit={onSubmit} isSubmitting={isSubmitting} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: el form propiamente dicho. Separado para que su state local
// (rating/comment) se resetee si el usuario submite (el parent cambia
// hasMyReview → este subcomponente se desmonta).
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewPromptFormProps {
  onSubmit:     ReviewPromptCardProps["onSubmit"];
  isSubmitting: boolean;
}

const ReviewPromptForm: React.FC<ReviewPromptFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");

  const trimmedComment = comment.trim();
  const canSubmit = rating >= 1 && trimmedComment.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert(strings.reviews.errorTitle, strings.reviews.minRatingError);
      return;
    }
    if (trimmedComment.length === 0) {
      // Comentario obligatorio: aporta valor a la comunidad, no solo puntaje.
      Alert.alert(strings.reviews.errorTitle, strings.reviews.minCommentError);
      return;
    }
    const res = await onSubmit(rating, trimmedComment);
    if (!res.ok) {
      Alert.alert(
        strings.reviews.errorTitle,
        res.message ?? strings.reviews.errorMsg,
      );
    }
    // Caso ok: el parent actualiza `hasMyReview=true` → la card se re-renderiza
    // con el estado de agradecimiento. No limpiamos estado local porque el
    // componente se va a desmontar.
  };

  return (
    <InfoSection title={strings.reviews.promptTitle}>
      <View style={styles.form}>
        <View style={styles.starsRow}>
          <StarRating
            value={rating}
            onChange={isSubmitting ? undefined : setRating}
            size={32}
          />
        </View>

        <TextInput
          placeholder={strings.reviews.commentPlaceholder}
          multiline
          numberOfLines={3}
          maxLength={COMMENT_MAX}
          value={comment}
          onChangeText={setComment}
          editable={!isSubmitting}
        />

        <Button
          label={strings.reviews.promptCta}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!canSubmit}
          fullWidth
        />
      </View>
    </InfoSection>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Form
  form: {
    gap: spacing[3],
  },
  starsRow: {
    alignItems:     "center",
    marginVertical: spacing[2],
  },

  // Thanks
  thanksBody: {
    alignItems:      "center",
    gap:             spacing[3],
    paddingVertical: spacing[2],
  },
  checkCircle: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: colors.status.success,
    alignItems:      "center",
    justifyContent:  "center",
  },
  thanksDesc: {
    ...typography.bodyMd,
    color:     colors.text.secondary,
    textAlign: "center",
  },
});
