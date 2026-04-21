// Ruta: /(client)/home/[id]/reviews
// Lista completa de reseñas del profesional. Se llega tocando el badge de
// rating en el perfil. Wrapper delgado: toma el id del URL y delega a
// AllReviewsScreen.

import { useRouter, useLocalSearchParams } from "expo-router";

import { AllReviewsScreen } from "@/features/reviews/screens/AllReviewsScreen";

export default function AllReviewsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <AllReviewsScreen professionalId={id} onBack={() => router.back()} />;
}
