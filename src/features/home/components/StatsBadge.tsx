import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';

interface StatsBadgeProps {
  questionCount: number;
  photoCount: number;
  onPress: () => void;
}

export function StatsBadge({ questionCount, photoCount, onPress }: StatsBadgeProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.line}>{questionCount} questions</Text>
      <Text style={styles.line}>{photoCount} photos</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'flex-end',
  },
  line: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
