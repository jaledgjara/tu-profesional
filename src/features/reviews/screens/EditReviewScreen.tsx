// Screen: EditReviewScreen
// Capa: feature screen (reviews)
// Rutas: /(client)/home/[id]/edit-review, /(client)/search/[id]/edit-review
//
// Form de edición pre-cargado con la reseña actual del usuario. Dos acciones:
//   - "Guardar cambios"  → updateReview vía useSubmitReview.submit
//   - "Borrar reseña"    → deleteReview vía useSubmitReview.remove (con Alert)
//
// Al salir exitoso, hace `onDone()` → el route padre decide hacer `router.back()`.
// El perfil que lo lanzó refresca sus datos mediante `useFocusEffect` al recuperar
// foco (ver home/[id]/index.tsx y search/[id]/index.tsx).

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Button,
  IconButton,
  MiniLoader,
  Placeholder,
  TextInput,
} from "@/shared/components";
import { StarRating } from "@/features/reviews/components/StarRating";
import { useMyReview } from "@/features/reviews/hooks/useMyReview";
import { useSubmitReview } from "@/features/reviews/hooks/useSubmitReview";
import { colors, typography, spacing } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

const COMMENT_MAX = 1000;

interface EditReviewScreenProps {
  professionalId: string;
  onBack:         () => void;
  /** Disparado tras update o delete exitoso. El route padre decide qué hacer (normalmente back). */
  onDone:         () => void;
}

export const EditReviewScreen: React.FC<EditReviewScreenProps> = ({
  professionalId,
  onBack,
  onDone,
}) => {
  const { myReview, isLoading, error } = useMyReview(professionalId);
  const { submit, remove, isSubmitting } = useSubmitReview();

  // ── Form state — se inicializa cuando myReview llega ────────────────────
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    }
  }, [myReview]);

  // ── Loading / empty states ─────────────────────────────────────────────
  if (isLoading) {
    return <MiniLoader label={strings.common.loading} />;
  }

  if (error || !myReview) {
    // Caso raro: el user llegó a la ruta sin haber reseñado (deep link,
    // o borró y usó "forward" del navegador). Mostramos placeholder.
    return (
      <View style={styles.screen}>
        <AppHeader
          variant="blue"
          titleAlign="left"
          title={strings.reviews.editTitle}
          leftAction={
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
          }
        />
        <Placeholder
          icon={
            <Ionicons
              name="document-outline"
              size={32}
              color={colors.text.tertiary}
            />
          }
          title={strings.reviews.emptyTitle}
          description={strings.reviews.emptyDesc}
          actionLabel={strings.common.back}
          onAction={onBack}
        />
      </View>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────
  const trimmedComment = comment.trim();

  const handleSave = async () => {
    if (rating < 1) {
      Alert.alert(strings.reviews.errorTitle, strings.reviews.minRatingError);
      return;
    }
    if (trimmedComment.length === 0) {
      Alert.alert(strings.reviews.errorTitle, strings.reviews.minCommentError);
      return;
    }

    const res = await submit(myReview, {
      professionalId,
      rating,
      comment: trimmedComment,
    });

    if (!res.ok) {
      Alert.alert(
        strings.reviews.errorTitle,
        res.message ?? strings.reviews.errorMsg,
      );
      return;
    }

    onDone();
  };

  const handleDelete = () => {
    Alert.alert(
      strings.reviews.deleteConfirmTitle,
      strings.reviews.deleteConfirmMsg,
      [
        { text: strings.common.cancel, style: "cancel" },
        {
          text:    strings.reviews.deleteCta,
          style:   "destructive",
          onPress: async () => {
            const res = await remove(myReview.id);
            if (!res.ok) {
              Alert.alert(
                strings.reviews.errorTitle,
                res.message ?? strings.reviews.errorMsg,
              );
              return;
            }
            onDone();
          },
        },
      ],
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <AppHeader
        variant="blue"
        titleAlign="left"
        title={strings.reviews.editTitle}
        leftAction={
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
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Estrellas */}
        <Text style={styles.label}>{strings.reviews.ratingLabel}</Text>
        <View style={styles.starsRow}>
          <StarRating
            value={rating}
            onChange={isSubmitting ? undefined : setRating}
            size={40}
          />
        </View>

        {/* Comentario */}
        <Text style={styles.label}>{strings.reviews.commentLabel}</Text>
        <TextInput
          placeholder={strings.reviews.commentPlaceholder}
          multiline
          numberOfLines={4}
          maxLength={COMMENT_MAX}
          value={comment}
          onChangeText={setComment}
          editable={!isSubmitting}
        />

        {/* Acciones */}
        <View style={styles.actions}>
          <Button
            label={strings.reviews.updateCta}
            onPress={handleSave}
            loading={isSubmitting}
            disabled={isSubmitting || rating < 1 || trimmedComment.length === 0}
            fullWidth
          />
          <Button
            label={strings.reviews.deleteCta}
            variant="danger"
            onPress={handleDelete}
            disabled={isSubmitting}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: colors.background.screen,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[10],
    gap:               spacing[3],
  },
  label: {
    ...typography.caption,
    color:         colors.text.secondary,
    textTransform: "uppercase",
    marginTop:     spacing[2],
  },
  starsRow: {
    alignItems:      "center",
    paddingVertical: spacing[2],
  },
  actions: {
    marginTop: spacing[4],
    gap:       spacing[2],
  },
});
