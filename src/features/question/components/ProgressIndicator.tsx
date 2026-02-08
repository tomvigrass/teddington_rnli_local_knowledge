import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing } from '../../../core/constants/spacing';

interface ProgressIndicatorProps {
  current: number;
  total?: number;
  mode: 'test' | 'endless';
}

export function ProgressIndicator({ current, total, mode }: ProgressIndicatorProps) {
  const text =
    mode === 'endless'
      ? `Questions answered: ${current}`
      : `Question ${current} of ${total}`;

  const progress = mode === 'test' && total ? current / total : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      {mode === 'test' && total && (
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  barBackground: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
