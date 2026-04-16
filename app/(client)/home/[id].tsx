// Ruta: /(client)/home/[id]
// Perfil público de un profesional visto por el usuario final.
// Parámetros: id (string), distanceM (string, opcional — desde la lista).

import { useRouter, useLocalSearchParams } from "expo-router";

import { ProfessionalBriefcaseScreen } from "@/features/professionals/screens/ProfessionalBriefcaseScreen";
import { useProfessionalDetail } from "@/features/professionals/hooks/useProfessionalDetail";
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
  const { detail, isLoading, error } = useProfessionalDetail(id, distanceM);

  if (isLoading) return <MiniLoader label={strings.common.loading} />;

  if (error || !detail) {
    return (
      <Placeholder
        icon={<Ionicons name="cloud-offline-outline" size={32} color={colors.status.error} />}
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
      modalityReadOnly
      showBackButton
      onBack={() => router.back()}
    />
  );
}
