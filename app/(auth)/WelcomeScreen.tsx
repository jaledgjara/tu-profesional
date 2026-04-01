import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/shared/components';
import { colors, typography, fontFamilies, spacing, layout } from '@/shared/theme';
import { strings } from '@/shared/utils/strings';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.appName}>
          {strings.common.appName}
        </Text>
        <Text style={styles.title}>
          {strings.auth.splashTitle}
        </Text>
        <Text style={styles.subtitle}>
          {strings.auth.splashSubtitle}
        </Text>
      </View>

      {/* ── CTA ──────────────────────────────────────────── */}
      <View style={styles.cta}>
        <Button
          label={strings.auth.splashCta}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/SignInScreen')}
        />
      </View>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <View style={styles.footer}>

        {/* Badge seguridad — vertical */}
        <View style={styles.securityBadge}>
          <View style={styles.shieldCircle}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>
          <Text style={styles.securityText}>
            {strings.auth.splashSecurity}
          </Text>
        </View>

        {/* Términos */}
        <Text style={styles.terms}>
          {strings.auth.splashPrivacyNote}
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex:              1,
    backgroundColor:   colors.background.screen,
    paddingHorizontal: layout.screenPaddingH,
  },

  // ── HERO (ocupa todo el espacio libre, contenido centrado)
  hero: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    gap:             spacing[3],
  },
  appName: {
    ...typography.overline,
    color:         colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign:     'center',
  },
  title: {
    fontFamily:    fontFamilies.display.extraBold,  // BricolageGrotesque_800ExtraBold
    fontSize:      42,
    lineHeight:    48,
    letterSpacing: -1.5,
    color:         colors.text.brandDark,
    textAlign:     'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color:     colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[1],
  },

  // ── CTA (flotando entre hero y footer)
  cta: {
    paddingVertical: spacing[6],
  },

  // ── FOOTER (pegado al fondo)
  footer: {
    alignItems:    'center',
    gap:           spacing[3],
    paddingBottom: spacing[4],
  },

  // Badge seguridad — columna
  securityBadge: {
    alignItems: 'center',
    gap:        spacing[2],
  },
  shieldCircle: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.brand.primaryLight,   // blue-50 — on-brand, limpio
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border.brand,          // blue-200
  },
  shieldEmoji: {
    fontSize: 22,
  },
  securityText: {
    ...typography.caption,
    color:     colors.text.secondary,
    textAlign: 'center',
  },

  // Términos
  terms: {
    ...typography.label,
    color:      colors.text.tertiary,
    textAlign:  'center',
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },

});
