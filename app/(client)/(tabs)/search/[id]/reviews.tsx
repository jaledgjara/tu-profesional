// Ruta: /(client)/search/[id]/reviews
// Wrapper delgado — ver el gemelo en home/[id]/reviews.tsx.

import { useRouter, useLocalSearchParams } from "expo-router";

import { AllReviewsScreen } from "@/features/reviews/screens/AllReviewsScreen";

export default function SearchAllReviewsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <AllReviewsScreen professionalId={id} onBack={() => router.back()} />;
}
