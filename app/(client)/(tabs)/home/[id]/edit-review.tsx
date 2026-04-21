// Ruta: /(client)/home/[id]/edit-review
// Pantalla para editar o borrar la reseña del usuario sobre un profesional.
// Wrapper delgado: toma `id` del URL y delega a EditReviewScreen.
// Al terminar (save o delete), hace router.back() para volver al perfil,
// que refresca su estado mediante useFocusEffect.

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
