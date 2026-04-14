// ProfessionalForm — formulario reutilizable del profesional.
// Capa: features/professionals/components
//
// Lo consumen:
//   - app/(auth)/ProfessionalFormScreen.tsx → onboarding (crea su primer perfil)
//   - app/(professional)/profile/edit-profile.tsx → edición (actualiza datos)
//
// El componente es "self-contained": maneja su propio estado para TODOS los
// campos, el image picker, los chips de sub-especialidades y el alert de
// permisos. Sólo emite hacia afuera el `onSubmit(values)` con los datos ya
// agrupados en el shape de `ProfessionalFormData`.
//
// `initialValues` permite precargar el formulario en modo edit. Si cambia
// por prop (ej. el hook termina de traer la fila), los inputs se sincronizan.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
  Switch, Pressable, StyleSheet, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {
  AppHeader, AppAlert, IconButton, Avatar, TextInput,
  Dropdown, Button, StickyBottomBar,
} from "@/shared/components";
import {
  colors, typography, spacing, layout, componentRadius,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import type { ProfessionalFormData } from "@/features/auth/hooks/useSaveProfessional";

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍA — cuando se sumen categorías, extender acá.
// ─────────────────────────────────────────────────────────────────────────────

export enum ProfessionalCategory {
  PSYCHOLOGY = "psychology",
}

const CATEGORY_OPTIONS: { label: string; value: ProfessionalCategory }[] = [
  { label: "Psicología", value: ProfessionalCategory.PSYCHOLOGY },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfessionalFormProps {
  /** Valores iniciales. Si cambian por prop, los inputs re-sincronizan. */
  initialValues?: Partial<ProfessionalFormData>;
  /** Ejecutado al tocar el CTA con los datos del form. */
  onSubmit: (data: ProfessionalFormData) => void | Promise<void>;
  /** Label del CTA (ej. "Guardar" vs "Continuar"). */
  submitLabel: string;
  /** Label mientras se ejecuta el onSubmit. */
  submittingLabel?: string;
  /** Si es `true`, el CTA queda disabled y muestra `submittingLabel`. */
  isSubmitting?: boolean;
  /**
   * Bloquea los datos identitarios del profesional (nombre, DNI, teléfono,
   * matrícula). Pensado para el flujo de edición: estos campos deberían
   * cambiar sólo con validación humana, no desde la app.
   */
  lockPersonalInfo?: boolean;
  /** Navegación del botón atrás del header. */
  onBack?: () => void;
}

interface AlertState {
  visible:      boolean;
  title:        string;
  message:      string;
  onConfirm?:   () => void;
  confirmLabel?: string;
}
const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export function ProfessionalForm({
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel = "Guardando...",
  isSubmitting = false,
  lockPersonalInfo = false,
  onBack,
}: ProfessionalFormProps) {

  // ── ALERT ─────────────────────────────────────────────────────────────────
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  // ── STATE DE CAMPOS ───────────────────────────────────────────────────────
  const [photoUri,         setPhotoUri]         = useState<string | null>(initialValues?.photoUri ?? null);
  const [category,         setCategory]         = useState<string>(initialValues?.category ?? "");
  const [fullName,         setFullName]         = useState<string>(initialValues?.fullName ?? "");
  const [dni,              setDni]              = useState<string>(initialValues?.dni ?? "");
  const [phone,            setPhone]            = useState<string>(initialValues?.phone ?? "");
  const [license,          setLicense]          = useState<string>(initialValues?.license ?? "");
  const [description,      setDescription]      = useState<string>(initialValues?.description ?? "");
  const [quote,            setQuote]            = useState<string>(initialValues?.quote ?? "");
  const [quoteAuthor,      setQuoteAuthor]      = useState<string>(initialValues?.quoteAuthor ?? "");
  const [socialWhatsapp,   setSocialWhatsapp]   = useState<string>(initialValues?.socialWhatsapp ?? "");
  const [socialInstagram,  setSocialInstagram]  = useState<string>(initialValues?.socialInstagram ?? "");
  const [socialLinkedin,   setSocialLinkedin]   = useState<string>(initialValues?.socialLinkedin ?? "");
  const [socialTwitter,    setSocialTwitter]    = useState<string>(initialValues?.socialTwitter ?? "");
  const [socialTiktok,     setSocialTiktok]     = useState<string>(initialValues?.socialTiktok ?? "");
  const [specialty,        setSpecialty]        = useState<string>(initialValues?.specialty ?? "");
  const [subSpecialties,   setSubSpecialties]   = useState<string[]>(initialValues?.subSpecialties ?? []);
  const [subSpecInput,     setSubSpecInput]     = useState<string>("");
  const [attendsOnline,    setAttendsOnline]    = useState<boolean>(initialValues?.attendsOnline ?? false);
  const [attendsPresencial,setAttendsPresencial]= useState<boolean>(initialValues?.attendsPresencial ?? false);

  // ── SYNC — si `initialValues` llega después (ej. hook async), hidratamos ──
  // Sólo aplica cuando el user todavía no tocó nada (evita pisar ediciones).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !initialValues) return;
    // Si hay al menos 1 campo con valor, consideramos que es la carga inicial.
    const anyValue =
      Object.values(initialValues).some(
        (v) => (typeof v === "string" && v.length > 0) || (Array.isArray(v) && v.length > 0) || v === true,
      );
    if (!anyValue) return;

    setPhotoUri(initialValues.photoUri ?? null);
    setCategory(initialValues.category ?? "");
    setFullName(initialValues.fullName ?? "");
    setDni(initialValues.dni ?? "");
    setPhone(initialValues.phone ?? "");
    setLicense(initialValues.license ?? "");
    setDescription(initialValues.description ?? "");
    setQuote(initialValues.quote ?? "");
    setQuoteAuthor(initialValues.quoteAuthor ?? "");
    setSocialWhatsapp(initialValues.socialWhatsapp ?? "");
    setSocialInstagram(initialValues.socialInstagram ?? "");
    setSocialLinkedin(initialValues.socialLinkedin ?? "");
    setSocialTwitter(initialValues.socialTwitter ?? "");
    setSocialTiktok(initialValues.socialTiktok ?? "");
    setSpecialty(initialValues.specialty ?? "");
    setSubSpecialties(initialValues.subSpecialties ?? []);
    setAttendsOnline(initialValues.attendsOnline ?? false);
    setAttendsPresencial(initialValues.attendsPresencial ?? false);
    hydratedRef.current = true;
  }, [initialValues]);

  const canSave = fullName.trim().length > 0 && category.length > 0;

  const handleSubmit = useCallback(() => {
    onSubmit({
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
  }, [
    photoUri, category, fullName, dni, phone, license, description,
    quote, quoteAuthor, specialty, subSpecialties, attendsOnline,
    attendsPresencial, socialWhatsapp, socialInstagram, socialLinkedin,
    socialTwitter, socialTiktok, onSubmit,
  ]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status: current } = await ImagePicker.getMediaLibraryPermissionsAsync();

    const permissionDeniedAlert = () => setAlert({
      visible: true,
      title: strings.proSetup.profileTitle,
      message: strings.proSetup.photoPermissionMsg,
      confirmLabel: "Ir a Configuración",
      onConfirm: () => {
        dismissAlert();
        Linking.openSettings();
      },
    });

    if (current === "denied") {
      permissionDeniedAlert();
      return;
    }
    if (current === "undetermined") {
      const { status: asked } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (asked === "denied") {
        permissionDeniedAlert();
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:    ["images"] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect:        [1, 1],
      quality:       0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const addSubSpec = () => {
    const trimmed = subSpecInput.trim();
    if (!trimmed || subSpecialties.includes(trimmed)) {
      setSubSpecInput("");
      return;
    }
    setSubSpecialties((prev) => [...prev, trimmed]);
    setSubSpecInput("");
  };

  const removeSubSpec = (item: string) =>
    setSubSpecialties((prev) => prev.filter((s) => s !== item));

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.safe}>
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          onBack ? (
            <IconButton
              icon={
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.icon.inverse}
                />
              }
              onPress={onBack}
            />
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. FOTO ─────────────────────────────────────── */}
          <View style={styles.photoSection}>
            <Avatar
              name={fullName || strings.proSetup.profileTitle}
              imageUrl={photoUri}
              size="xl"
              showCameraButton
              onCameraPress={pickImage}
            />
            <Text style={styles.photoTitle}>{strings.proSetup.profileTitle}</Text>
            <Text style={styles.photoHint}>{strings.proSetup.photoPickerMsg}</Text>
          </View>

          {/* ── 2. CATEGORÍA ────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{strings.proSetup.category}</Text>
          <Dropdown
            value={category}
            options={CATEGORY_OPTIONS}
            onSelect={setCategory}
            placeholder="Seleccioná una categoría..."
          />

          {/* ── 3. INFO PERSONAL ────────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.personalInfo}
          </Text>

          <TextInput
            label={strings.proSetup.fullName}
            leftPrefix="LIC."
            placeholder="Nombre y apellido"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="next"
            locked={lockPersonalInfo}
            editable={!lockPersonalInfo}
          />
          <TextInput
            label={strings.proSetup.dni}
            placeholder="12 345 678"
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
            returnKeyType="next"
            locked={lockPersonalInfo}
            editable={!lockPersonalInfo}
          />
          <TextInput
            label={strings.proSetup.phone}
            placeholder="+54 9 261 000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
            locked={lockPersonalInfo}
            editable={!lockPersonalInfo}
          />
          <TextInput
            label={strings.proSetup.verifiedLicense}
            placeholder="MP 00000"
            value={license}
            onChangeText={setLicense}
            keyboardType="default"
            returnKeyType="next"
            locked={lockPersonalInfo}
            editable={!lockPersonalInfo}
          />
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

          {/* ── 4. INSPIRACIÓN ──────────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.inspiration}
          </Text>
          <TextInput
            label={strings.proSetup.quote}
            placeholder={`"La vida no es la que uno vivió..."`}
            value={quote}
            onChangeText={setQuote}
            returnKeyType="next"
          />
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
            label="X"
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

          {/* ── 6. PERSONALIZACIÓN ──────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {strings.proSetup.personalization}
          </Text>
          <TextInput
            label={strings.proSetup.specialty}
            placeholder={strings.proSetup.specialtyPlaceholder}
            value={specialty}
            onChangeText={setSpecialty}
            returnKeyType="next"
          />

          {/* SUB-ESPECIALIDADES */}
          <View style={styles.subSpecWrapper}>
            <Text style={styles.inputLabel}>{strings.proSetup.subSpecialties}</Text>

            {subSpecialties.length > 0 && (
              <View style={styles.chipsRow}>
                {subSpecialties.map((item) => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                    <Pressable onPress={() => removeSubSpec(item)} hitSlop={8}>
                      <Ionicons name="close" size={12} color={colors.text.inverse} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

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

          {/* MODALIDAD — online / presencial */}
          <View style={styles.switchRow}>
            <Text style={[typography.bodyMd, styles.switchLabel]}>
              {strings.proSetup.attendOnline}
            </Text>
            <Switch
              value={attendsOnline}
              onValueChange={setAttendsOnline}
              trackColor={{ false: colors.border.default, true: colors.brand.accent }}
              thumbColor={colors.background.card}
              ios_backgroundColor={colors.border.default}
            />
          </View>

          <View style={[styles.switchRow, styles.switchRowLast]}>
            <Text style={[typography.bodyMd, styles.switchLabel]}>
              {strings.proSetup.attendPresencial}
            </Text>
            <Switch
              value={attendsPresencial}
              onValueChange={setAttendsPresencial}
              trackColor={{ false: colors.border.default, true: colors.brand.accent }}
              thumbColor={colors.background.card}
              ios_backgroundColor={colors.border.default}
            />
          </View>
        </ScrollView>

        {/* ── CTA ─────────────────────────────────────────── */}
        <StickyBottomBar>
          <Button
            label={isSubmitting ? submittingLabel : submitLabel}
            variant="primary"
            size="lg"
            fullWidth
            uppercase
            disabled={!canSave || isSubmitting}
            onPress={handleSubmit}
          />
        </StickyBottomBar>
      </KeyboardAvoidingView>

      <AppAlert
        visible={alert.visible}
        icon={<Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />}
        title={alert.title}
        message={alert.message}
        dismissLabel={strings.auth.alertClose}
        confirmLabel={alert.confirmLabel}
        onConfirm={alert.onConfirm}
        onDismiss={dismissAlert}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop:        spacing[6],
    paddingBottom:     spacing[4],
  },

  photoSection: {
    alignItems:   "center",
    gap:          spacing[2],
    marginBottom: spacing[8],
  },
  photoTitle: {
    ...typography.h2,
    color:     colors.text.primary,
    marginTop: spacing[2],
  },
  photoHint: {
    ...typography.caption,
    color:     colors.brand.accent,
    textAlign: "center",
  },

  sectionLabel: {
    ...typography.overline,
    color:         colors.text.secondary,
    textTransform: "uppercase",
    marginBottom:  spacing[3],
  },
  sectionLabelTop: {
    marginTop: spacing[7],
  },

  inputLabel: {
    ...typography.inputLabel,
    textTransform: "uppercase",
    color:         colors.text.secondary,
    marginBottom:  spacing[2],
  },

  subSpecWrapper: {
    marginBottom: spacing[3],
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing[2],
    marginBottom:  spacing[3],
  },
  chip: {
    flexDirection:     "row",
    alignItems:        "center",
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
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           spacing[2],
  },
  subSpecInputFlex: { flex: 1 },
  addButton: {
    width:           layout.touchTargetMin,
    height:          layout.touchTargetMin,
    backgroundColor: colors.brand.primary,
    borderRadius:    componentRadius.button,
    alignItems:      "center",
    justifyContent:  "center",
  },

  switchRow: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingVertical:   spacing[4],
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
