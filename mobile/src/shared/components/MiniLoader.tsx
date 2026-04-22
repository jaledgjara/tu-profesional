import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

import { colors, typography, spacing } from "@/shared/theme";

interface MiniLoaderProps {
  label?: string;
}

export const MiniLoader: React.FC<MiniLoaderProps> = ({
  label = "Cargando",
}) => (
  <View style={styles.container}>
    <ActivityIndicator size="small" color={colors.brand.primary} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.background.screen,
  },
  label: {
    ...typography.label,
    color: colors.text.brand,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
