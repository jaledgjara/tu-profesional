// Placeholder — card informativa genérica para cualquier estado visual
// Capa: shared/components
// Clientes: usuario final + profesional
//
// Uso:
//   <Placeholder
//     icon={<Ionicons name="calendar-outline" size={32} color={colors.text.tertiary} />}
//     title="Sin turnos próximos"
//     description="Cuando agendes una cita, va a aparecer acá."
//   />
//
//   <Placeholder
//     icon={<Ionicons name="alert-circle-outline" size={32} color={colors.status.error} />}
//     title="Algo salió mal"
//     description="No pudimos cargar los datos."
//     actionLabel="Reintentar"
//     onAction={() => refetch()}
//   />

import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { Button } from "@/shared/components/Button";
import {
  colors,
  typography,
  spacing,
  componentRadius,
} from "@/shared/theme";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface PlaceholderProps {
  /** Ícono de @expo/vector-icons. Recomendado: size 32, color text.tertiary. */
  icon?: React.ReactNode;

  /** Título corto que explica el estado. */
  title: string;

  /** Texto secundario con más contexto o instrucciones. */
  description?: string;

  /** Label del botón de acción. Si no se pasa, no se renderiza botón. */
  actionLabel?: string;

  /** Callback del botón de acción. */
  onAction?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export const Placeholder: React.FC<PlaceholderProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {/* ÍCONO */}
      {icon && <View style={styles.iconCircle}>{icon}</View>}

      {/* TEXTO */}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}

      {/* ACCIÓN OPCIONAL */}
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button
            label={actionLabel}
            variant="ghost"
            size="sm"
            onPress={onAction}
          />
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.background.card,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: "dashed",
    minHeight: 100,
  },

  iconCircle: {
    width: spacing[12],
    height: spacing[12],
    borderRadius: spacing[12],
    backgroundColor: colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },

  title: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: "center",
  },

  description: {
    ...typography.bodySm,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[1],
  },

  actionWrapper: {
    marginTop: spacing[4],
  },
});
