import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AnswerButton, AnswerState } from './AnswerButton';
import { spacing } from '../../../core/constants/spacing';

interface AnswerListProps {
  options: string[];
  selectedAnswer?: string;
  correctAnswer?: string;
  showFeedback: boolean;
  onSelect: (answer: string) => void;
  disabled?: boolean;
}

const LABELS = ['A', 'B', 'C', 'D'];

export function AnswerList({
  options,
  selectedAnswer,
  correctAnswer,
  showFeedback,
  onSelect,
  disabled,
}: AnswerListProps) {
  const getState = (option: string): AnswerState => {
    if (!showFeedback) {
      return option === selectedAnswer ? 'selected' : 'default';
    }

    // Showing feedback (review mode or endless mode)
    if (option === correctAnswer) return 'correct';
    if (option === selectedAnswer && option !== correctAnswer) return 'incorrect';
    return 'default';
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <AnswerButton
          key={index}
          label={LABELS[index]}
          text={option}
          state={getState(option)}
          onPress={() => onSelect(option)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
