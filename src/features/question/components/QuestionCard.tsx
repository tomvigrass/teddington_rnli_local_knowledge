import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { QuestionImage } from './QuestionImage';
import { getImage } from '../../../services/ImageService';
import { colors } from '../../../core/constants/colors';
import { typography } from '../../../core/constants/typography';
import { spacing } from '../../../core/constants/spacing';

interface QuestionCardProps {
  questionText: string;
  imageRef?: string;
}

export function QuestionCard({ questionText, imageRef }: QuestionCardProps) {
  const imageSource = imageRef ? getImage(imageRef) : null;

  return (
    <View style={styles.container}>
      {imageSource && (
        <View style={styles.imageContainer}>
          <QuestionImage source={imageSource} />
        </View>
      )}
      <Text style={styles.questionText}>{questionText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  imageContainer: {
    marginBottom: spacing.md,
  },
  questionText: {
    ...typography.h3,
    color: colors.textPrimary,
    lineHeight: 28,
  },
});
