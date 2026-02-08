import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';

interface FeedbackOverlayProps {
  isCorrect: boolean;
  explanation: string;
  referenceSection: string;
}

export function FeedbackOverlay({
  isCorrect,
  explanation,
  referenceSection,
}: FeedbackOverlayProps) {
  useEffect(() => {
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isCorrect]);

  return (
    <View
      style={[
        styles.container,
        { borderLeftColor: isCorrect ? colors.success : colors.error },
      ]}
    >
      <Text
        style={[
          styles.header,
          { color: isCorrect ? colors.success : colors.error },
        ]}
      >
        {isCorrect ? 'Correct!' : 'Incorrect'}
      </Text>
      <Text style={styles.explanation}>{explanation}</Text>
      <View style={styles.reference}>
        <Text style={styles.referenceLabel}>LOP Reference:</Text>
        <Text style={styles.referenceText}>{referenceSection}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    ...typography.bodyMedium,
    marginBottom: spacing.sm,
  },
  explanation: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  reference: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  referenceLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  referenceText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
