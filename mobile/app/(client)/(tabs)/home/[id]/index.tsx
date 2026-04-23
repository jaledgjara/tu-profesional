// Ruta: /(client)/home/[id]
// Perfil público de un profesional visto por el usuario final.
// Parámetros: id (string), distanceM (string, opcional — desde la lista).
//
// Orquesta 4 hooks:
//   - useProfessionalDetail: datos del pro + dirección
//   - useProfessionalReviews: stats (box del hero) + lista (no usada acá)
//   - useMyReview: ¿ya reseñó? (decide form vs "gracias")
//   - useSubmitReview: submit del form inline
//
// Reglas de acceso al form:
//   - Sesión iniciada
//   - role === 'client'
//   - id del perfil !== id del usuario (no auto-reseña)

import { useCallback, useRef } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import { useProfessionalDetail } from "@/features/professionals/hooks/useProfessionalDetail";
import { useProfessionalReviewStats } from "@/features/reviews/hooks/useProfessionalReviewStats";
import { useMyReview } from "@/features/reviews/hooks/useMyReview";
import { useSubmitReview } from "@/features/reviews/hooks/useSubmitReview";
import { useAuthStore } from "@/features/auth/store/authStore";
import { MiniLoader, Placeholder } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

export default function ClientProfessionalProfile() {
  const router = useRouter();
  const { id, distanceM: distanceParam } = useLocalSearchParams<{
    id: string;
    distanceM?: string;
  }>();

  const distanceM = distanceParam ? Number(distanceParam) : undefined;

  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  const { detail, isLoading, error } = useProfessionalDetail(id, distanceM);

  const {
    stats: reviewStats,
    refetch: refetchReviews,
  } = useProfessionalReviewStats(id);

  // Solo clients que no sean el propio pro pueden dejar reseña.
  const canWriteReview =
    !!session?.user &&
    profile?.role === "client" &&
    session.user.id !== id;

  const { myReview, refetch: refetchMyReview } = useMyReview(
    id,
    canWriteReview, // enabled — no gastamos roundtrip si el usuario no puede reseñar
  );

  const { submit, isSubmitting } = useSubmitReview();

  const handleSubmitReview = useCallback(
    async (rating: number, comment: string | null) => {
      const res = await submit(myReview, {
        professionalId: id,
        rating,
        comment,
      });
      if (res.ok) {
        // Actualiza el estado local: myReview pasa a tener valor y la card
        // switchea de form → "gracias". Y el stats del hero se re-calcula.
        refetchMyReview();
        refetchReviews();
      }
      return res;
    },
    [submit, myReview, id, refetchMyReview, refetchReviews],
  );

  // Al volver de /edit-review, refrescamos myReview y stats para reflejar
  // update o delete. `skipFirstFocus` evita doble fetch al montar la screen
  // (los hooks ya hacen su fetch inicial por su cuenta).
  const skipFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocus.current) {
        skipFirstFocus.current = false;
        return;
      }
      refetchMyReview();
      refetchReviews();
    }, [refetchMyReview, refetchReviews]),
  );

  if (isLoading) return <MiniLoader label={strings.common.loading} />;

  if (error || !detail) {
    return (
      <Placeholder
        icon={
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={colors.status.error}
          />
        }
        title={strings.home.errorTitle}
        description={strings.home.errorDesc}
        actionLabel={strings.common.back}
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ProfessionalBriefcaseScreen
      detail={detail}
      reviewStats={reviewStats}
      myReview={myReview}
      canWriteReview={canWriteReview}
      onSubmitReview={handleSubmitReview}
      isSubmittingReview={isSubmitting}
      modalityReadOnly
      showBackButton
      onBack={() => router.back()}
      onSeeAllReviews={() => router.push(`/home/${id}/reviews`)}
      onEditReview={() => router.push(`/home/${id}/edit-review`)}
    />
  );
}
