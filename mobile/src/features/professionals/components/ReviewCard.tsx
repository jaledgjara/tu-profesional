import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/shared/components';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';
import { formatReviewDate } from '@/shared/utils/format';

interface ReviewCardProps {
  rating:        number;       // 1-5
  text:          string;
  authorName:    string;
  authorImageUrl?: string | null;
  dateString:    string;       // ISO date
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  rating, text, authorName, authorImageUrl, dateString,
}) => (
  <View style={[styles.card, getShadow('sm')]}>
    <View style={styles.header}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Text key={i} style={{ color: i < rating ? '#FBBF24' : colors.border.default }}>
            ★
          </Text>
        ))}
      </View>
      <Text style={[typography.caption, { color: colors.text.tertiary }]}>
        {formatReviewDate(dateString).toUpperCase()}
      </Text>
    </View>

    <Text style={[typography.bodyMd, { color: colors.text.primary, fontStyle: 'italic' }]}>
      "{text}"
    </Text>

    <View style={styles.author}>
      <Avatar imageUrl={authorImageUrl} name={authorName} size="xs" />
      <Text style={[typography.caption, { color: colors.text.secondary }]}>
        {authorName}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.reviewCard,
    padding:         spacing[4],
    gap:             spacing[3],
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  stars: {
    flexDirection: 'row',
    gap:           2,
  },
  author: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
  },
});
