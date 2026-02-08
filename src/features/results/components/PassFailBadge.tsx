import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing, borderRadius } from '../../../core/constants/spacing';

interface PassFailBadgeProps {
  passed: boolean;
}

export function PassFailBadge({ passed }: PassFailBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: passed ? colors.successLight : colors.errorLight },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: passed ? colors.success : colors.error },
        ]}
      >
        {passed ? 'PASS' : 'FAIL'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  text: {
    ...typography.h3,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
