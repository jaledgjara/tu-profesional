import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  IconButton,
  ScreenTitle,
  TextInput,
  Button,
  StickyBottomBar,
} from "@/shared/components";
import { colors, typography, spacing, layout } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { UserType } from "../Type/UserType";
import { useSaveLocation } from "@/features/auth/hooks/useSaveLocation";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface LocationFormScreenProps {
  mode: UserType;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN POR MODO
// Agregar un modo nuevo aquí propaga el cambio a todos los puntos de uso.
// ─────────────────────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<
  UserType,
  {
    title: string;
    description: string;
    destination: string;
  }
> = {
  client: {
    title: strings.auth.clientLocationTitle,
    description: strings.auth.clientLocationDesc,
    destination: "/(client)/home",
  },
  professional: {
    title: strings.auth.proLocationTitle,
    description: strings.auth.proLocationDesc,
    destination: "/(professional)/home",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function LocationFormScreen({ mode }: LocationFormScreenProps) {
  const config = MODE_CONFIG[mode];

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const { useGps, save, gpsLoading, saving } = useSaveLocation();

  const canContinue = street.trim().length > 0 && number.trim().length > 0;

  const handleUseGps = async () => {
    try {
      const address = await useGps();
      if (address.street)     setStreet(address.street);
      if (address.number)     setNumber(address.number);
      if (address.postalCode) setPostalCode(address.postalCode);
      if (address.city)       setCity(address.city);
    } catch (err: any) {
      Alert.alert("No pudimos obtener tu ubicación", err?.message ?? "Probá de nuevo.");
    }
  };

  const handleContinue = async () => {
    try {
      await save({
        street, number,
        floor:      floor || null,
        apartment:  apartment || null,
        postalCode: postalCode || null,
        city:       city || null,
        province:   "Mendoza",
        country:    "Argentina",
      });
      router.replace(config.destination as never);
    } catch (err: any) {
      Alert.alert("No pudimos guardar tu ubicación", err?.message ?? "Probá de nuevo.");
    }
  };

  return (
    <View style={styles.safe}>
      {/* ── HEADER ─────────────────────────────────────────── */}
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          <IconButton
            icon={
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.icon.inverse}
              />
            }
            onPress={() => router.back()}
          />
        }
      />

      {/* ── FORM ───────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ScreenTitle title={config.title} description={config.description} />

          {/* GPS */}
          <Button
            label={
              gpsLoading
                ? "Obteniendo ubicación..."
                : `📍  ${strings.proSetup.useCurrentLocation}`
            }
            variant="ghost"
            size="md"
            fullWidth
            disabled={gpsLoading}
            onPress={handleUseGps}
          />

          {/* DETALLE */}
          <Text style={styles.sectionLabel}>
            {strings.proSetup.addressDetail}
          </Text>

          {/* CALLE */}
          <TextInput
            label={strings.proSetup.street}
            placeholder={strings.proSetup.streetPlaceholder}
            value={street}
            onChangeText={setStreet}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* NÚMERO + PISO */}
          <View style={styles.row}>
            <TextInput
              label={strings.proSetup.number}
              placeholder="123"
              value={number}
              onChangeText={setNumber}
              keyboardType="numeric"
              returnKeyType="next"
              containerStyle={styles.halfInput}
            />
            <TextInput
              label={strings.proSetup.floor}
              placeholder="2"
              value={floor}
              onChangeText={setFloor}
              keyboardType="numeric"
              returnKeyType="next"
              containerStyle={styles.halfInput}
            />
          </View>

          {/* DEPARTAMENTO + CÓDIGO POSTAL */}
          <View style={styles.row}>
            <TextInput
              label={strings.proSetup.apartment}
              placeholder="A"
              value={apartment}
              onChangeText={setApartment}
              autoCapitalize="characters"
              returnKeyType="next"
              containerStyle={styles.halfInput}
            />
            <TextInput
              label={strings.proSetup.postalCode}
              placeholder="5500"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="numeric"
              returnKeyType="done"
              containerStyle={styles.halfInput}
            />
          </View>

          {/* PROVINCIA — bloqueado */}
          <TextInput
            label={strings.proSetup.province}
            value="Mendoza, Argentina"
            locked
          />
        </ScrollView>

        {/* ── CONTINUAR ────────────────────────────────────── */}
        <StickyBottomBar transparent noBorder>
          <Button
            label={saving ? "Guardando..." : strings.auth.continueCta}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue || saving}
            onPress={handleContinue}
          />
        </StickyBottomBar>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.text.secondary,
    textTransform: "uppercase",
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: "row",
    gap: spacing[3],
  },
  halfInput: {
    flex: 1,
  },
});
