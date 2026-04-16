// Ruta: /(client)/settings/account/delete-account
// Eliminar cuenta — misma UI que el profesional.

import React, { useState } from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  ScreenHero,
  IconButton,
  Button,
  AppAlert,
} from "@/shared/components";
import {
  colors,
  spacing,
  typography,
  componentRadius,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useAccountActions } from "@/features/auth/hooks/useAccountActions";

interface AlertState {
  mode:    "hidden" | "confirm" | "error";
  message: string;
}

const INITIAL_ALERT: AlertState = { mode: "hidden", message: "" };

export default function DeleteAccountScreen() {
  const { deleteAccount, isDeleting } = useAccountActions();
  const [alert, setAlert] = useState<AlertState>(INITIAL_ALERT);

  const openConfirm = () => setAlert({ mode: "confirm", message: strings.deleteAccount.alertMessage });
  const dismissAlert = () => setAlert(INITIAL_ALERT);

  const handleConfirm = async () => {
    dismissAlert();
    try {
      await deleteAccount();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : strings.deleteAccount.errorMessage;
      setAlert({ mode: "error", message: msg });
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          <IconButton
            icon={<Ionicons name="chevron-back" size={24} color={colors.text.inverse} />}
            onPress={() => router.back()}
          />
        }
      />
      <ScreenHero variant="title" title={strings.deleteAccount.title} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.bodyMd, styles.subtitle]}>
          {strings.deleteAccount.subtitle}
        </Text>

        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <Ionicons
              name="warning-outline"
              size={22}
              color={colors.status.error}
            />
            <Text style={[typography.h4, styles.warningTitle]}>
              {strings.deleteAccount.warningTitle}
            </Text>
          </View>
          <View style={styles.warningList}>
            {strings.deleteAccount.warningItems.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[typography.bodySm, styles.bulletText]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={strings.deleteAccount.confirmCta}
            variant="danger"
            size="md"
            fullWidth
            onPress={openConfirm}
            disabled={isDeleting}
            loading={isDeleting}
          />
          <Button
            label={strings.deleteAccount.cancelCta}
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => router.back()}
            disabled={isDeleting}
          />
        </View>
      </ScrollView>

      <AppAlert
        visible={alert.mode === "confirm"}
        icon={<Ionicons name="trash-outline" size={28} color={colors.status.error} />}
        title={strings.deleteAccount.alertTitle}
        message={alert.message}
        confirmLabel={strings.deleteAccount.alertConfirm}
        cancelLabel={strings.deleteAccount.cancelCta}
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onDismiss={dismissAlert}
      />

      <AppAlert
        visible={alert.mode === "error"}
        icon={<Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />}
        title={strings.deleteAccount.errorTitle}
        message={alert.message}
        dismissLabel={strings.auth.alertClose}
        onDismiss={dismissAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: colors.background.screen,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[10],
    gap:               spacing[5],
  },
  subtitle: {
    color: colors.text.secondary,
  },
  warningBox: {
    padding:         spacing[4],
    borderRadius:    componentRadius.card,
    backgroundColor: colors.status.errorBg,
    borderWidth:     1,
    borderColor:     colors.status.error,
    gap:             spacing[3],
  },
  warningHeader: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing[2],
  },
  warningTitle: {
    color: colors.status.error,
  },
  warningList: {
    gap: spacing[2],
  },
  bulletRow: {
    flexDirection: "row",
    gap:           spacing[2],
  },
  bullet: {
    color:      colors.status.error,
    fontSize:   16,
    lineHeight: 20,
  },
  bulletText: {
    flex:  1,
    color: colors.text.primary,
  },
  actions: {
    gap:       spacing[3],
    marginTop: spacing[4],
  },
});
