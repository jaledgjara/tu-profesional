// Ruta: /(client)/search/[id]/edit-review
// Igual que home/[id]/edit-review.tsx pero desde el stack de búsqueda.

import { useRouter, useLocalSearchParams } from "expo-router";

import { EditReviewScreen } from "@/features/reviews/screens/EditReviewScreen";

export default function EditReviewRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return (
    <EditReviewScreen
      professionalId={id}
      onBack={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
