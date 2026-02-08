import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';

interface LastScoreBadgeProps {
  correct: number;
  total: number;
  totalAttempted: number;
}

export function LastScoreBadge({
  correct,
  total,
  totalAttempted,
}: LastScoreBadgeProps) {
  const passed = correct / total >= 0.9;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.scoreBox}>
          <Text style={styles.label}>Last score</Text>
          <Text style={[styles.score, { color: passed ? colors.success : colors.error }]}>
            {correct}/{total}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreBox}>
          <Text style={styles.label}>Total attempted</Text>
          <Text style={styles.score}>{totalAttempted}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  score: {
    ...typography.h2,
    color: colors.textPrimary,
  },
});
