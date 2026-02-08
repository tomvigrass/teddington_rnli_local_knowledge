import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { spacing } from '../../../core/constants/spacing';

interface ScoreDisplayProps {
  correct: number;
  total: number;
}

export function ScoreDisplay({ correct, total }: ScoreDisplayProps) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = correct / total >= 0.9;

  return (
    <View style={styles.container}>
      <Text style={[styles.score, { color: passed ? colors.success : colors.error }]}>
        {correct}/{total}
      </Text>
      <Text style={styles.percentage}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  score: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 64,
  },
  percentage: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
