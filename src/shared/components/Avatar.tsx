import React from 'react';
import {
  View, Text, Image, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { colors, typography, componentRadius, getShadow } from '@/shared/theme';
import { getInitials, getAvatarBgColor } from '@/shared/utils/avatarColor';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  // La foto de perfil. Es el dato de mayor impacto en confianza del usuario.
  // Cuando está presente, tiene prioridad absoluta sobre el fallback.
  imageUrl?: string | null;

  // Nombre completo — se usa para iniciales y color determinístico del fallback.
  name: string;

  size?: AvatarSize;

  // Forma: `circle` (default) o `rounded` (cuadrada con esquinas redondeadas).
  // `rounded` se usa en hero de perfiles grandes, donde la foto funciona más
  // como "portada" que como avatar.
  rounded?: boolean;

  // Badges de estado superpuestos
  showVerifiedBadge?: boolean;    // checkmark jade (profesional verificado)
  showAvailabilityDot?: boolean;  // punto verde (online/disponible)

  // Modo edición — muestra ícono de cámara para cambiar foto
  showCameraButton?: boolean;
  onCameraPress?: () => void;

  onPress?: () => void;
  style?: object;
}

// Dimensiones por tamaño
const SIZE_MAP: Record<AvatarSize, { size: number; fontSize: number; badgeSize: number }> = {
  xs:  { size: 32,  fontSize: 12, badgeSize: 12 },
  sm:  { size: 44,  fontSize: 16, badgeSize: 16 },
  md:  { size: 56,  fontSize: 20, badgeSize: 18 },
  lg:  { size: 80,  fontSize: 28, badgeSize: 22 },
  xl:  { size: 100, fontSize: 34, badgeSize: 26 },
  xxl: { size: 140, fontSize: 46, badgeSize: 32 },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name,
  size = 'md',
  rounded = false,
  showVerifiedBadge = false,
  showAvailabilityDot = false,
  showCameraButton = false,
  onCameraPress,
  onPress,
  style,
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const { size: dim, fontSize, badgeSize } = SIZE_MAP[size];
  const initials = getInitials(name);
  const bgColor = getAvatarBgColor(name);
  const showFallback = !imageUrl || imageError;
  const frameRadius = rounded ? componentRadius.card : componentRadius.avatarCircle;

  const Container = onPress ? Pressable : View;
  const containerProps = onPress ? { onPress } : {};

  return (
    <Container
      {...containerProps}
      style={[{ position: 'relative', width: dim, height: dim }, style]}
    >
      {/* IMAGEN PRINCIPAL */}
      <View
        style={[
          styles.imageContainer,
          {
            width: dim,
            height: dim,
            borderRadius: frameRadius,
            backgroundColor: bgColor,
          },
        ]}
      >
        {/* FALLBACK — iniciales (siempre renderizado, oculto cuando hay foto) */}
        {showFallback && (
          <Text
            style={[
              styles.initials,
              { fontSize, lineHeight: dim },
            ]}
          >
            {initials}
          </Text>
        )}

        {/* FOTO REAL */}
        {imageUrl && !imageError && (
          <Image
            source={{ uri: imageUrl }}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: frameRadius },
              !imageLoaded && styles.hidden,
            ]}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </View>

      {/* BADGE: VERIFICADO (checkmark jade, esquina inferior derecha) */}
      {showVerifiedBadge && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Text style={styles.verifiedIcon}>✓</Text>
        </View>
      )}

      {/* DOT: DISPONIBILIDAD (punto verde, esquina inferior derecha) */}
      {showAvailabilityDot && !showVerifiedBadge && (
        <View
          style={[
            styles.availabilityDot,
            {
              width: badgeSize * 0.6,
              height: badgeSize * 0.6,
              borderRadius: (badgeSize * 0.6) / 2,
              bottom: 2,
              right: 2,
            },
          ]}
        />
      )}

      {/* BOTÓN CÁMARA (modo edición) */}
      {showCameraButton && (
        <Pressable
          onPress={onCameraPress}
          style={[
            styles.cameraButton,
            {
              width: badgeSize + 4,
              height: badgeSize + 4,
              borderRadius: (badgeSize + 4) / 2,
              bottom: 0,
              right: 0,
            },
            getShadow('sm'),
          ]}
        >
          {/* Ícono cámara — usar vector icon library en implementación real */}
          <Text style={styles.cameraIcon}>📷</Text>
        </Pressable>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: typography.h2.fontFamily,
    fontWeight: '700',
    color: colors.avatarFallback.text,
    textAlign: 'center',
  },
  hidden: {
    opacity: 0,
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  verifiedIcon: {
    fontSize: 9,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  availabilityDot: {
    position: 'absolute',
    backgroundColor: colors.status.success,
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  cameraButton: {
    position: 'absolute',
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 10,
  },
});
