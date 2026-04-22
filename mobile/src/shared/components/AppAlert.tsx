import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";

import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
  zIndex,
  duration,
  easings,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface AppAlertProps {
  /** Controla visibilidad del modal. */
  visible: boolean;

  /** Ícono de @expo/vector-icons arriba del título. Si no se pasa, no se renderiza. */
  icon?: React.ReactNode;

  /** Título principal del alert. */
  title: string;

  /** Texto descriptivo debajo del título. */
  message?: string;

  /** Label del botón de confirmación. Default: "Confirmar". */
  confirmLabel?: string;

  /** Label del botón de cancelar. Default: strings.common.cancel. */
  cancelLabel?: string;

  /**
   * Label del botón único en modo dismiss (sin onConfirm).
   * Default: "Cerrar".
   */
  dismissLabel?: string;

  /** Variante visual del botón de confirmar. */
  confirmVariant?: "primary" | "danger";

  /**
   * Callback al presionar el botón de confirmar.
   * Si NO se pasa, el alert se renderiza con un solo botón de dismiss.
   */
  onConfirm?: () => void;

  /** Callback al presionar cancelar, dismiss o el backdrop. */
  onDismiss: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export const AppAlert: React.FC<AppAlertProps> = ({
  visible,
  icon,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = strings.common.cancel,
  dismissLabel = "Cerrar",
  confirmVariant = "primary",
  onConfirm,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration.slow,
          easing: easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 280,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const confirmBg =
    confirmVariant === "danger" ? colors.status.error : colors.brand.primary;
  const confirmShadow = confirmVariant === "danger" ? {} : getShadow("brand");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[styles.backdropFill, { opacity: opacityAnim }]}
        />

        {/* ── CARD ─────────────────────────────────────────── */}
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <Pressable onPress={() => {}}>
            <Animated.View
              style={[
                styles.card,
                getShadow("lg"),
                {
                  opacity: opacityAnim,
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                  ],
                },
              ]}>
              {/* ÍCONO */}
              {icon && <View style={styles.iconWrapper}>{icon}</View>}

              {/* TÍTULO */}
              <Text style={styles.title}>{title}</Text>

              {/* MENSAJE */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* BOTONES */}
              <View style={styles.buttonRow}>
                {onConfirm ? (
                  <>
                    <Pressable
                      onPress={onDismiss}
                      style={({ pressed }) => [
                        styles.button,
                        styles.cancelButton,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}>
                      <Text style={styles.cancelLabel}>{cancelLabel}</Text>
                    </Pressable>
                    <Pressable
                      onPress={onConfirm}
                      style={({ pressed }) => [
                        styles.button,
                        styles.confirmButton,
                        { backgroundColor: confirmBg },
                        confirmShadow,
                        { opacity: pressed ? 0.88 : 1 },
                        pressed && { transform: [{ translateY: 1 }] },
                      ]}>
                      <Text style={styles.confirmLabel}>{confirmLabel}</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={onDismiss}
                    style={({ pressed }) => [
                      styles.button,
                      styles.confirmButton,
                      { backgroundColor: colors.brand.primary },
                      getShadow("brand"),
                      { opacity: pressed ? 0.88 : 1 },
                      pressed && { transform: [{ translateY: 1 }] },
                    ]}>
                    <Text style={styles.confirmLabel}>{dismissLabel}</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: zIndex.overlay,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.light,
  },

  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    zIndex: zIndex.modal,
  },

  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.background.card,
    borderRadius: componentRadius.modal,
    paddingTop: spacing[7],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[6],
    alignItems: "center",
  },

  iconWrapper: {
    width: spacing[12],
    height: spacing[12],
    borderRadius: spacing[12],
    backgroundColor: colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },

  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing[2],
  },

  message: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[6],
  },

  buttonRow: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%",
    marginTop: spacing[2],
  },

  button: {
    flex: 1,
    height: 48,
    borderRadius: componentRadius.button,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButton: {
    backgroundColor: colors.background.subtle,
  },
  cancelLabel: {
    ...typography.buttonMd,
    color: colors.text.secondary,
  },

  confirmButton: {
    // backgroundColor se aplica inline según confirmVariant
  },
  confirmLabel: {
    ...typography.buttonMd,
    color: colors.text.inverse,
  },
});
