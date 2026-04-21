// Ruta: /(client)/search/[id]
// Perfil público de un profesional accedido desde búsqueda o categoría.
// Parámetros: id (string), distanceM (string, opcional — desde la lista).
//
// Misma estructura que home/[id]/index.tsx (debería extraerse a un hook
// compartido `useProfessionalProfileBundle` cuando crezca).

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

export default function SearchProfessionalProfile() {
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

  const canWriteReview =
    !!session?.user &&
    profile?.role === "client" &&
    session.user.id !== id;

  const { myReview, refetch: refetchMyReview } = useMyReview(
    id,
    canWriteReview,
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
        refetchMyReview();
        refetchReviews();
      }
      return res;
    },
    [submit, myReview, id, refetchMyReview, refetchReviews],
  );

  // Al volver de /edit-review, refrescamos estado del perfil.
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
      onSeeAllReviews={() => router.push(`/search/${id}/reviews`)}
      onEditReview={() => router.push(`/search/${id}/edit-review`)}
    />
  );
}
