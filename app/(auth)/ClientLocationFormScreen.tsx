import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppHeader,
  IconButton,
  ScreenTitle,
  TextInput,
  Button,
  StickyBottomBar,
} from '@/shared/components';
import { colors, typography, spacing, layout } from '@/shared/theme';
import { strings } from '@/shared/utils/strings';

export default function ClientLocationFormScreen() {
  const [street, setStreet]     = useState('');
  const [number, setNumber]     = useState('');
  const [floor, setFloor]       = useState('');
  const [apartment, setApartment] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const canContinue = street.trim().length > 0 && number.trim().length > 0;

  return (
    <View style={styles.safe}>

      {/* ── HEADER ───────────────────────────────────────── */}
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

      {/* ── FORM ─────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle title={strings.proSetup.locationTitle} />

          {/* ── GPS BUTTON ─────────────────────────────── */}
          <Button
            label={`📍  ${strings.proSetup.useCurrentLocation}`}
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => {/* expo-location: pedir permiso y autocompletar */}}
          />

          {/* ── DETALLE ────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{strings.proSetup.addressDetail}</Text>

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

          {/* PROVINCIA Y PAÍS — bloqueado */}
          <TextInput
            label={strings.proSetup.province}
            value="Mendoza, Argentina"
            locked
          />

        </ScrollView>

        {/* ── CONTINUAR ────────────────────────────────────── */}
        <StickyBottomBar transparent noBorder>
          <Button
            label={strings.auth.continueCta}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue}
            onPress={() => router.replace('/(client)/home')}
          />
        </StickyBottomBar>

      </KeyboardAvoidingView>
    </View>
  );
}

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
    textTransform: 'uppercase',
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfInput: {
    flex: 1,
  },
});
