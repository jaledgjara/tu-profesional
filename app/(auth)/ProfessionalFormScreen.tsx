import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
  Switch, Pressable, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  AppHeader, AppAlert, IconButton, Avatar, TextInput,
  Dropdown, Button, StickyBottomBar,
} from '@/shared/components';
import {
  colors, typography, spacing, layout, componentRadius,
} from '@/shared/theme';
import { strings } from '@/shared/utils/strings';
import { useSaveProfessional } from '@/features/auth/hooks/useSaveProfessional';

// ─────────────────────────────────────────────────────────────────────────────
// ENUM DE CATEGORÍA
// Agregar nuevas categorías aquí cuando se expanda el marketplace.
// ─────────────────────────────────────────────────────────────────────────────

export enum ProfessionalCategory {
  PSYCHOLOGY = 'psychology',
}

const CATEGORY_OPTIONS: { label: string; value: ProfessionalCategory }[] = [
  { label: 'Psicología', value: ProfessionalCategory.PSYCHOLOGY },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

interface AlertState { visible: boolean; title: string; message: string; }
const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

export default function ProfessionalFormScreen() {

  // ── ALERT ───────────────────────────────────────────────────────────────
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  // ── FOTO ─────────────────────────────────────────────────────────────────
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // ── CATEGORÍA ────────────────────────────────────────────────────────────
  const [category, setCategory] = useState<string>('');

  // ── INFORMACIÓN PERSONAL ─────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState('');
  const [dni,         setDni]         = useState('');
  const [phone,       setPhone]       = useState('');
  const [license,     setLicense]     = useState('');
  const [description, setDescription] = useState('');

  // ── INSPIRACIÓN ──────────────────────────────────────────────────────────
  const [quote,       setQuote]       = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');

  // ── REDES SOCIALES ────────────────────────────────────────────────────────
  const [socialWhatsapp,  setSocialWhatsapp]  = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialLinkedin,  setSocialLinkedin]  = useState('');
  const [socialTwitter,   setSocialTwitter]   = useState('');
  const [socialTiktok,    setSocialTiktok]    = useState('');

  // ── PERSONALIZACIÓN ──────────────────────────────────────────────────────
  const [specialty,        setSpecialty]        = useState('');
  const [subSpecialties,   setSubSpecialties]   = useState<string[]>([]);
  const [subSpecInput,     setSubSpecInput]      = useState('');
  const [attendsOnline,    setAttendsOnline]    = useState(false);
  const [attendsPresencial,setAttendsPresencial]= useState(false);

  const { saveProfessional, saving } = useSaveProfessional();

  const canSave = fullName.trim().length > 0 && category.length > 0;

  const handleSave = async () => {
    try {
      await saveProfessional({
        photoUri,
        category,
        fullName,
        dni,
        phone,
        license,
        description,
        quote,
        quoteAuthor,
        specialty,
        subSpecialties,
        attendsOnline,
        attendsPresencial,
        socialWhatsapp,
        socialInstagram,
        socialLinkedin,
        socialTwitter,
        socialTiktok,
      });
      // Navegación directa — no a través del guard. Razón: el guard manda
      // needs-location+professional a ESTA screen, así que `router.replace('/')`
      // causaría un loop. La ubicación es el paso siguiente; al guardarse,
      // useSaveLocation llama a refresh() y el guard resuelve a home.
      router.replace('/(auth)/ProfessionalLocationFormScreen');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
      setAlert({ visible: true, title: strings.auth.alertProfessionalErrorTitle, message: msg });
    }
  };

  // ── HANDLERS ─────────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setAlert({
        visible: true,
        title: strings.proSetup.profileTitle,
        message: strings.proSetup.photoPermissionMsg,
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const addSubSpec = () => {
    const trimmed = subSpecInput.trim();
    if (!trimmed || subSpecialties.includes(trimmed)) {
      setSubSpecInput('');
      return;
    }
    setSubSpecialties((prev) => [...prev, trimmed]);
    setSubSpecInput('');
  };

  const removeSubSpec = (item: string) =>
    setSubSpecialties((prev) => prev.filter((s) => s !== item));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── 1. FOTO + TÍTULO ─────────────────────────────── */}
          <View style={styles.photoSection}>
            <Avatar
              name={fullName || strings.proSetup.profileTitle}
              imageUrl={photoUri}
              size="xl"
              showCameraButton
              onCameraPress={pickImage}
            />
            <Text style={styles.photoTitle}>
              {strings.proSetup.profileTitle}
            </Text>
            <Text style={styles.photoHint}>
              {strings.proSetup.photoPickerMsg}
            </Text>
          </View>

          {/* ── 2. CATEGORÍA ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>
            {strings.proSetup.category}
          </Text>
          <Dropdown
            value={category}
            options={CATEGORY_OPTIONS}
            onSelect={setCategory}
            placeholder="Seleccioná una categoría..."
          />

          {/* ── 3. INFORMACIÓN PERSONAL ──────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.personalInfo}
          </Text>

          {/* NOMBRE COMPLETO */}
          <TextInput
            label={strings.proSetup.fullName}
            leftPrefix="LIC."
            placeholder="Nombre y apellido"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* DNI */}
          <TextInput
            label={strings.proSetup.dni}
            placeholder="12 345 678"
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
            returnKeyType="next"
          />

          {/* TELÉFONO */}
          <TextInput
            label={strings.proSetup.phone}
            placeholder="+54 9 261 000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          {/* MATRÍCULA VERIFICADA */}
          <TextInput
            label={strings.proSetup.verifiedLicense}
            placeholder="MP 00000"
            value={license}
            onChangeText={setLicense}
            keyboardType="default"
            returnKeyType="next"
          />

          {/* DESCRIPCIÓN PERSONAL */}
          <TextInput
            label={strings.proSetup.descriptionPersonal}
            placeholder={strings.proSetup.descriptionPlaceholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            returnKeyType="default"
            textAlignVertical="top"
          />

          {/* ── 4. INSPIRACIÓN ───────────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.inspiration}
          </Text>

          {/* FRASE */}
          <TextInput
            label={strings.proSetup.quote}
            placeholder={`"La vida no es la que uno vivió..."`}
            value={quote}
            onChangeText={setQuote}
            returnKeyType="next"
          />

          {/* AUTOR */}
          <TextInput
            label={strings.proSetup.quoteAuthor}
            placeholder="Gabriel García Márquez"
            value={quoteAuthor}
            onChangeText={setQuoteAuthor}
            returnKeyType="done"
          />

          {/* ── 5. REDES SOCIALES ───────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.socialNetworks}
          </Text>

          <TextInput
            label="WHATSAPP"
            placeholder="+54 9 261 000-0000"
            value={socialWhatsapp}
            onChangeText={setSocialWhatsapp}
            keyboardType="phone-pad"
            returnKeyType="next"
            leftIcon={
              <Ionicons name="logo-whatsapp" size={18} color={colors.text.secondary} />
            }
          />

          <TextInput
            label="INSTAGRAM"
            placeholder="@tu.usuario"
            value={socialInstagram}
            onChangeText={setSocialInstagram}
            autoCapitalize="none"
            returnKeyType="next"
            leftIcon={
              <Ionicons name="logo-instagram" size={18} color={colors.text.secondary} />
            }
          />

          <TextInput
            label="LINKEDIN"
            placeholder="linkedin.com/in/tu-perfil"
            value={socialLinkedin}
            onChangeText={setSocialLinkedin}
            autoCapitalize="none"
            returnKeyType="next"
            leftIcon={
              <Ionicons name="logo-linkedin" size={18} color={colors.text.secondary} />
            }
          />

          <TextInput
            label="TWITTER / X"
            placeholder="@tu.usuario"
            value={socialTwitter}
            onChangeText={setSocialTwitter}
            autoCapitalize="none"
            returnKeyType="next"
            leftIcon={
              <Ionicons name="logo-twitter" size={18} color={colors.text.secondary} />
            }
          />

          <TextInput
            label="TIKTOK"
            placeholder="@tu.usuario"
            value={socialTiktok}
            onChangeText={setSocialTiktok}
            autoCapitalize="none"
            returnKeyType="done"
            leftIcon={
              <Ionicons name="logo-tiktok" size={18} color={colors.text.secondary} />
            }
          />

          {/* ── 6. PERSONALIZACIÓN ───────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.personalization}
          </Text>

          {/* ESPECIALIDAD */}
          <TextInput
            label={strings.proSetup.specialty}
            placeholder={strings.proSetup.specialtyPlaceholder}
            value={specialty}
            onChangeText={setSpecialty}
            returnKeyType="next"
          />

          {/* SUB-ESPECIALIDADES */}
          <View style={styles.subSpecWrapper}>
            <Text style={styles.inputLabel}>
              {strings.proSetup.subSpecialties}
            </Text>

            {/* Chips de sub-especialidades ya agregadas */}
            {subSpecialties.length > 0 && (
              <View style={styles.chipsRow}>
                {subSpecialties.map((item) => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                    <Pressable
                      onPress={() => removeSubSpec(item)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close"
                        size={12}
                        color={colors.text.inverse}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Fila de input + botón agregar */}
            <View style={styles.subSpecInputRow}>
              <View style={styles.subSpecInputFlex}>
                <TextInput
                  placeholder={strings.proSetup.subSpecialtiesPlaceholder}
                  value={subSpecInput}
                  onChangeText={setSubSpecInput}
                  onSubmitEditing={addSubSpec}
                  returnKeyType="done"
                  autoCapitalize="none"
                />
              </View>
              <Pressable
                onPress={addSubSpec}
                style={({ pressed }) => [
                  styles.addButton,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Ionicons name="add" size={22} color={colors.text.inverse} />
              </Pressable>
            </View>
          </View>

          {/* ATENCIÓN ONLINE */}
          <View style={styles.switchRow}>
            <Text style={[typography.bodyMd, styles.switchLabel]}>
              {strings.proSetup.attendOnline}
            </Text>
            <Switch
              value={attendsOnline}
              onValueChange={setAttendsOnline}
              trackColor={{
                false: colors.border.default,
                true:  colors.brand.accent,
              }}
              thumbColor={colors.background.card}
              ios_backgroundColor={colors.border.default}
            />
          </View>

          {/* PRESENCIAL */}
          <View style={[styles.switchRow, styles.switchRowLast]}>
            <Text style={[typography.bodyMd, styles.switchLabel]}>
              {strings.proSetup.attendPresencial}
            </Text>
            <Switch
              value={attendsPresencial}
              onValueChange={setAttendsPresencial}
              trackColor={{
                false: colors.border.default,
                true:  colors.brand.accent,
              }}
              thumbColor={colors.background.card}
              ios_backgroundColor={colors.border.default}
            />
          </View>

        </ScrollView>

        {/* ── GUARDAR ──────────────────────────────────────── */}
        <StickyBottomBar>
          <Button
            label={saving ? 'Guardando...' : strings.proSetup.saveCta}
            variant="primary"
            size="lg"
            fullWidth
            uppercase
            disabled={!canSave || saving}
            onPress={handleSave}
          />
        </StickyBottomBar>

      </KeyboardAvoidingView>

      <AppAlert
        visible={alert.visible}
        icon={<Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />}
        title={alert.title}
        message={alert.message}
        dismissLabel={strings.auth.alertClose}
        onDismiss={dismissAlert}
      />
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
    paddingTop:        spacing[6],
    paddingBottom:     spacing[4],
  },

  // ── FOTO ───────────────────────────────────────────────────────────────────
  photoSection: {
    alignItems:    'center',
    gap:           spacing[2],
    marginBottom:  spacing[8],
  },
  photoTitle: {
    ...typography.h2,
    color:     colors.text.primary,
    marginTop: spacing[2],
  },
  photoHint: {
    ...typography.caption,
    color:     colors.brand.accent,
    textAlign: 'center',
  },

  // ── SECCIÓN LABELS ─────────────────────────────────────────────────────────
  sectionLabel: {
    ...typography.overline,
    color:         colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom:  spacing[3],
  },
  sectionLabelTop: {
    marginTop: spacing[7],
  },

  // ── INPUT LABEL (para sub-especialidades sin wrapper TextInput) ─────────────
  inputLabel: {
    ...typography.inputLabel,
    textTransform: 'uppercase',
    color:         colors.text.secondary,
    marginBottom:  spacing[2],
  },

  // ── SUB-ESPECIALIDADES ─────────────────────────────────────────────────────
  subSpecWrapper: {
    marginBottom: spacing[3],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[2],
    marginBottom:  spacing[3],
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[1.5],
    backgroundColor:   colors.brand.primary,
    borderRadius:      componentRadius.filterChip,
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
  },
  chipText: {
    ...typography.buttonSm,
    color: colors.text.inverse,
  },
  subSpecInputRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing[2],
  },
  subSpecInputFlex: {
    flex: 1,
  },
  addButton: {
    width:           layout.touchTargetMin,
    height:          layout.touchTargetMin,
    backgroundColor: colors.brand.primary,
    borderRadius:    componentRadius.button,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── SWITCHES ───────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingVertical:  spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  switchRowLast: {
    marginBottom: spacing[4],
  },
  switchLabel: {
    color: colors.text.primary,
  },
});
