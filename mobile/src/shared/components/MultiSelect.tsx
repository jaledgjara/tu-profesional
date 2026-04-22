// MultiSelect — trigger + modal bottom sheet para selección múltiple con grupos.
// Capa: shared/components
//
// Usado por ProfessionalForm para el campo `professional_area` del profesional:
// 23+ opciones agrupadas en 5 secciones. Un Dropdown plano sería ilegible, así
// que abrimos un modal con headers de sección y filas tocables tipo checklist.
//
// Shape de uso:
//   <MultiSelect
//     groups={PSYCHOLOGY_AREAS}
//     values={selected}
//     onChange={setSelected}
//     placeholder="Seleccioná tus áreas..."
//     emptyLabel="Aún no elegiste ninguna"
//     doneLabel="Listo"
//   />
//
// El trigger muestra un resumen:
//   - vacío        → placeholder
//   - 1-3 seleccionados → labels separados por " · "
//   - 4+ seleccionados  → "3 seleccionadas + N más"
//
// Los valores son slugs estables (id del catálogo), no los labels.

import React, { useMemo, useState } from "react";
import {
  View, Text, Pressable, Modal, ScrollView, StyleSheet, SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors, typography, spacing, componentRadius, getShadow, layout,
} from "@/shared/theme";

export interface MultiSelectOption {
  label: string;
  value: string;
  hint?: string;
}

export interface MultiSelectGroup {
  title: string;
  options: MultiSelectOption[];
}

interface MultiSelectProps {
  label?:       string;
  groups:       MultiSelectGroup[];
  values:       string[];
  onChange:     (values: string[]) => void;
  placeholder?: string;
  emptyLabel?:  string;
  doneLabel?:   string;
  /** Título que se muestra arriba del modal. */
  modalTitle?:  string;
}

const SUMMARY_CHIP_MAX = 3;

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  groups,
  values,
  onChange,
  placeholder = "Seleccionar...",
  emptyLabel  = "Sin selección",
  doneLabel   = "Listo",
  modalTitle,
}) => {
  const [open, setOpen]       = useState(false);
  const [draft, setDraft]     = useState<string[]>(values);

  // Index rápido id → label, recalculado cuando cambian los groups.
  const labelById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const g of groups) for (const o of g.options) m[o.value] = o.label;
    return m;
  }, [groups]);

  const openModal = () => {
    setDraft(values);
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const confirmAndClose = () => {
    onChange(draft);
    setOpen(false);
  };

  const toggle = (value: string) => {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const summary = useMemo(() => {
    if (values.length === 0) return null;
    const firstLabels = values
      .slice(0, SUMMARY_CHIP_MAX)
      .map((v) => labelById[v] ?? v);
    if (values.length <= SUMMARY_CHIP_MAX) return firstLabels.join(" · ");
    const extra = values.length - SUMMARY_CHIP_MAX;
    return `${firstLabels.join(" · ")}  +${extra}`;
  }, [values, labelById]);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable onPress={openModal} style={styles.trigger}>
        <Text
          style={[
            typography.inputText,
            {
              color: summary ? colors.text.primary : colors.text.tertiary,
              flex:  1,
            },
          ]}
          numberOfLines={2}
        >
          {summary ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.icon.default} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        {/* Backdrop Pressable = tap fuera cierra. El sheet tiene un Pressable
            interno vacío que "come" los taps para que no burbujeen y cierren
            el modal al tocar dentro. */}
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Pressable style={[styles.sheet, getShadow("lg")]} onPress={() => {}}>
            <SafeAreaView style={styles.sheetInner}>
              <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {modalTitle ?? label ?? "Seleccionar"}
              </Text>
              <Text style={styles.sheetCount}>
                {draft.length === 0 ? emptyLabel : `${draft.length} elegidas`}
              </Text>
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {groups.map((group) => (
                <View key={group.title} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {group.options.map((opt) => {
                    const checked = draft.includes(opt.value);
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => toggle(opt.value)}
                        style={({ pressed }) => [
                          styles.option,
                          { backgroundColor: pressed ? colors.background.subtle : "transparent" },
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxChecked,
                          ]}
                        >
                          {checked && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={colors.text.inverse}
                            />
                          )}
                        </View>
                        <View style={styles.optionText}>
                          <Text
                            style={[
                              typography.bodyMd,
                              {
                                color: checked
                                  ? colors.text.primary
                                  : colors.text.primary,
                                fontFamily: checked
                                  ? typography.buttonMd.fontFamily
                                  : typography.bodyMd.fontFamily,
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {opt.hint && (
                            <Text style={styles.optionHint} numberOfLines={2}>
                              {opt.hint}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

              <View style={styles.sheetFooter}>
                <Pressable
                  onPress={confirmAndClose}
                  style={({ pressed }) => [
                    styles.doneBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.doneBtnLabel}>{doneLabel}</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[3],
  },
  label: {
    ...typography.inputLabel,
    textTransform: "uppercase",
    color:         colors.text.secondary,
    marginBottom:  spacing[1.5],
  },
  trigger: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing[2],
    borderRadius:      componentRadius.dropdown,
    borderWidth:       1.5,
    borderColor:       colors.border.default,
    backgroundColor:   colors.background.card,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    minHeight:         44,
  },

  backdrop: {
    flex:            1,
    backgroundColor: colors.overlay.medium,
    justifyContent:  "flex-end",
  },

  // Alto fijo (no maxHeight): sin esto el ScrollView flex:1 colapsa a 0
  // y el usuario nunca ve las opciones.
  sheet: {
    height:               "85%",
    backgroundColor:      colors.background.card,
    borderTopLeftRadius:  componentRadius.modal,
    borderTopRightRadius: componentRadius.modal,
  },
  sheetInner: {
    flex:       1,
    paddingTop: spacing[2],
  },
  sheetHandle: {
    alignSelf:       "center",
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.border.default,
    marginBottom:    spacing[3],
  },
  sheetHeader: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom:     spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  sheetCount: {
    ...typography.caption,
    color:     colors.text.secondary,
    marginTop: spacing[0.5],
  },

  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical:   spacing[4],
  },
  group: {
    marginBottom: spacing[5],
  },
  groupTitle: {
    ...typography.overline,
    color:         colors.text.secondary,
    textTransform: "uppercase",
    marginBottom:  spacing[2],
  },

  option: {
    flexDirection:     "row",
    alignItems:        "flex-start",
    gap:               spacing[3],
    paddingVertical:   spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius:      componentRadius.actionItem,
    minHeight:         layout.touchTargetMin,
  },
  checkbox: {
    width:           22,
    height:          22,
    borderRadius:    6,
    borderWidth:     1.5,
    borderColor:     colors.border.default,
    backgroundColor: colors.background.card,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       2,
  },
  checkboxChecked: {
    backgroundColor: colors.brand.primary,
    borderColor:     colors.brand.primary,
  },
  optionText: {
    flex: 1,
    gap:  spacing[0.5],
  },
  optionHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  sheetFooter: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop:        spacing[3],
    paddingBottom:     spacing[3],
    borderTopWidth:    1,
    borderTopColor:    colors.border.subtle,
  },
  doneBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius:    componentRadius.button,
    minHeight:       48,
    alignItems:      "center",
    justifyContent:  "center",
  },
  doneBtnLabel: {
    ...typography.buttonMd,
    color:         colors.text.inverse,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
