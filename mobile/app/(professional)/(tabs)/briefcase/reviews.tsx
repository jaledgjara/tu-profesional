// Ruta: /(professional)/briefcase/reviews
// Lista completa de reseñas que el profesional recibió.
// Usa AllReviewsScreen con su propio id (tomado del auth store).
// La screen es la misma que ve el client — anonimato estructural garantizado
// por la vista reviews_public en DB. El pro no ve quién lo reseñó.

import { useRouter } from "expo-router";

import { AllReviewsScreen } from "@/features/reviews/screens/AllReviewsScreen";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function MyReviewsRoute() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const proId = session?.user?.id;
  if (!proId) return null;

  return <AllReviewsScreen professionalId={proId} onBack={() => router.back()} />;
}
