import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';

export type AnswerState = 'default' | 'selected' | 'correct' | 'incorrect';

interface AnswerButtonProps {
  label: string;
  text: string;
  state: AnswerState;
  onPress: () => void;
  disabled?: boolean;
}

const stateStyles: Record<AnswerState, { bg: string; border: string; text: string }> = {
  default: {
    bg: colors.white,
    border: colors.border,
    text: colors.textPrimary,
  },
  selected: {
    bg: colors.primary,
    border: colors.primary,
    text: colors.white,
  },
  correct: {
    bg: colors.successLight,
    border: colors.success,
    text: colors.textPrimary,
  },
  incorrect: {
    bg: colors.errorLight,
    border: colors.error,
    text: colors.textPrimary,
  },
};

export function AnswerButton({
  label,
  text,
  state,
  onPress,
  disabled,
}: AnswerButtonProps) {
  const stateStyle = stateStyles[state];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: stateStyle.bg,
          borderColor: stateStyle.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Option ${label}: ${text}`}
      accessibilityState={{ selected: state === 'selected' }}
    >
      <Text style={[styles.label, { color: stateStyle.text }]}>{label}</Text>
      <Text style={[styles.text, { color: stateStyle.text }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    minHeight: 56,
  },
  label: {
    ...typography.bodyMedium,
    width: 28,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.body,
    flex: 1,
  },
});
