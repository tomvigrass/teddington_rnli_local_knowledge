import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';

interface QuestionCountPickerProps {
  value: number;
  onChange: (count: number) => void;
}

const OPTIONS = [10, 20, 30, 50];

export function QuestionCountPicker({ value, onChange }: QuestionCountPickerProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((count) => (
        <TouchableOpacity
          key={count}
          style={[styles.option, value === count && styles.selected]}
          onPress={() => onChange(count)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === count }}
          accessibilityLabel={`${count} questions`}
        >
          <Text
            style={[styles.optionText, value === count && styles.selectedText]}
          >
            {count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.white,
  },
});
