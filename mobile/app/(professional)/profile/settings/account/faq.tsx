// Ruta: /(professional)/settings/account/faq
// Preguntas Frecuentes — accordion simple con expand/collapse por item.

import React, { useState } from "react";
import { View, ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero, IconButton } from "@/shared/components";
import {
  colors,
  spacing,
  typography,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

export default function FAQScreen() {
  // Índice del item expandido (-1 = todos colapsados). Sólo uno abierto a la
  // vez para que el usuario no pierda contexto al scrollear listas largas.
  const [openIndex, setOpenIndex] = useState<number>(-1);

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
      <ScreenHero variant="title" title={strings.faq.title} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.bodyMd, styles.subtitle]}>
          {strings.faq.subtitle}
        </Text>

        <View style={[styles.list, getShadow("xs")]}>
          {strings.faq.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const isLast = idx === strings.faq.items.length - 1;
            return (
              <View
                key={item.q}
                style={[
                  styles.item,
                  !isLast && styles.itemDivider,
                ]}
              >
                <Pressable
                  onPress={() => setOpenIndex(isOpen ? -1 : idx)}
                  style={styles.question}
                >
                  <Text style={[typography.bodyMd, styles.questionText]}>
                    {item.q}
                  </Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.brand.primary}
                  />
                </Pressable>
                {isOpen && (
                  <Text style={[typography.bodySm, styles.answer]}>
                    {item.a}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  list: {
    borderRadius:    componentRadius.card,
    overflow:        "hidden",
    backgroundColor: colors.background.card,
  },
  item: {
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  question: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            spacing[3],
    minHeight:      44,
  },
  questionText: {
    flex:       1,
    color:      colors.text.primary,
    fontWeight: "600",
  },
  answer: {
    marginTop:  spacing[2],
    color:      colors.text.secondary,
    lineHeight: 20,
  },
});
