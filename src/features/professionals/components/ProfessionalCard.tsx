import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ViewStyle,
} from 'react-native';
import { Avatar, Badge, Button } from '@/shared/components';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';
import { formatDistance, formatRating } from '@/shared/utils/format';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface ProfessionalCardProps {
  // Datos del profesional (mapeados desde el tipo DB de Supabase)
  id:           string;
  name:         string;
  title:        string;          // "Psicóloga clínica"
  specialty:    string;          // "Psicología Cognitivo-Conductual"
  zone:         string;          // "Palermo, CABA"
  imageUrl?:    string | null;
  tags?:        string[];        // ["ADULTOS", "TCC", "ONLINE"]
  rating?:      number;
  reviewCount?: number;
  distanceM?:   number;          // metros desde PostGIS
  isAvailable?: boolean;
  isFavorited?: boolean;

  // Layout
  layout?: 'horizontal' | 'vertical';  // horizontal=pantalla1, vertical=pantalla13

  // Handlers
  onPress:     () => void;
  onContact:   () => void;
  onFavorite?: () => void;

  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  name, title, specialty, zone, imageUrl, tags = [],
  rating, reviewCount, distanceM, isAvailable, isFavorited,
  layout = 'vertical', onPress, onContact, onFavorite, style,
}) => {
  if (layout === 'vertical') {
    return (
      <CardVertical
        name={name} title={title} specialty={specialty} zone={zone}
        imageUrl={imageUrl} tags={tags} rating={rating} reviewCount={reviewCount}
        distanceM={distanceM} isAvailable={isAvailable} isFavorited={isFavorited}
        onPress={onPress} onContact={onContact} onFavorite={onFavorite} style={style}
      />
    );
  }

  return (
    <CardHorizontal
      name={name} title={title} specialty={specialty} zone={zone}
      imageUrl={imageUrl} tags={tags} rating={rating} reviewCount={reviewCount}
      distanceM={distanceM} isAvailable={isAvailable} isFavorited={isFavorited}
      onPress={onPress} onContact={onContact} onFavorite={onFavorite} style={style}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT VERTICAL — pantalla 13 (lista principal, más compacta)
// ─────────────────────────────────────────────────────────────────────────────

type InnerCardProps = Omit<ProfessionalCardProps, 'layout' | 'id'>;

const CardVertical: React.FC<InnerCardProps> = ({
  name, title, specialty, zone, imageUrl, tags = [],
  rating, reviewCount, distanceM, isFavorited,
  onPress, onContact, style,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      cardStyles.base,
      getShadow('sm'),
      pressed && { opacity: 0.97 },
      style,
    ]}
  >
    {/* FILA SUPERIOR: avatar + info + rating */}
    <View style={cardStyles.topRow}>
      <Avatar imageUrl={imageUrl} name={name} size="sm" />
      <View style={cardStyles.infoBlock}>
        <Text style={[typography.h4, { color: colors.text.primary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[typography.caption, { color: colors.text.accent }]} numberOfLines={1}>
          {specialty}
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {zone}{distanceM !== undefined ? ` • ${formatDistance(distanceM)}` : ''}
        </Text>
      </View>
      {rating !== undefined && (
        <View style={cardStyles.ratingPill}>
          <Text style={[typography.rating, { color: colors.palette.blue700 }]}>
            ★ {rating.toFixed(1)}
          </Text>
          {reviewCount !== undefined && (
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              ({reviewCount})
            </Text>
          )}
        </View>
      )}
    </View>

    {/* TAGS */}
    {tags.length > 0 && (
      <View style={cardStyles.tagsRow}>
        {tags.slice(0, 3).map((tag) => (
          <Badge key={tag} label={tag} variant="tag" />
        ))}
      </View>
    )}

    {/* CTA */}
    <Button
      label="CONTACTAR"
      variant="primary"
      size="md"
      fullWidth
      uppercase
      onPress={onContact}
    />
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HORIZONTAL — pantalla 1 ("Destacados cerca tuyo")
// Más compacta horizontalmente, con botón de favorito a la derecha del CTA
// ─────────────────────────────────────────────────────────────────────────────

const CardHorizontal: React.FC<InnerCardProps> = ({
  name, title, specialty, zone, imageUrl, tags = [],
  rating, reviewCount, distanceM, isFavorited,
  onPress, onContact, onFavorite, style,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      cardStyles.base,
      getShadow('sm'),
      pressed && { opacity: 0.97 },
      style,
    ]}
  >
    {/* FILA SUPERIOR: avatar + info */}
    <View style={cardStyles.topRow}>
      <Avatar imageUrl={imageUrl} name={name} size="sm" />
      <View style={cardStyles.infoBlock}>
        <View style={cardStyles.nameRow}>
          <Text
            style={[typography.h4, { color: colors.text.primary, flex: 1 }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {rating !== undefined && (
            <Text style={[typography.rating, { color: colors.palette.blue700 }]}>
              ★ {rating.toFixed(1)}
            </Text>
          )}
        </View>
        <Text
          style={[typography.caption, { color: colors.text.accent }]}
          numberOfLines={1}
        >
          {specialty}
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          📍 {zone}{distanceM !== undefined ? ` (${formatDistance(distanceM)})` : ''}
        </Text>
      </View>
    </View>

    {/* TAGS */}
    {tags && tags.length > 0 && (
      <View style={cardStyles.tagsRow}>
        {tags.slice(0, 3).map((tag) => (
          <Badge key={tag} label={tag} variant="tag" />
        ))}
      </View>
    )}

    {/* CTA ROW: botón + favorito */}
    <View style={cardStyles.ctaRow}>
      <View style={{ flex: 1 }}>
        <Button
          label="Contactar"
          variant="primary"
          size="md"
          fullWidth
          onPress={onContact}
        />
      </View>
      {onFavorite && (
        <Pressable
          onPress={onFavorite}
          style={cardStyles.favoriteBtn}
          hitSlop={8}
        >
          <Text style={{ fontSize: 22 }}>
            {isFavorited ? '❤️' : '🤍'}
          </Text>
        </Pressable>
      )}
    </View>
  </Pressable>
);

const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.card,
    padding:         spacing[4],
    gap:             spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    gap:           spacing[3],
    alignItems:    'flex-start',
  },
  infoBlock: {
    flex: 1,
    gap:  spacing[0.5],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[0.5],
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing[2],
    paddingVertical:   spacing[0.5],
    borderRadius:      componentRadius.badge,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[1.5],
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
  },
  favoriteBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   22,
    backgroundColor: colors.background.subtle,
  },
});
