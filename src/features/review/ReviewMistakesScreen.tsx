import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeScreen } from '../../components/SafeScreen';
import { QuestionCard } from '../question/components/QuestionCard';
import { AnswerList } from '../question/components/AnswerList';
import { FeedbackOverlay } from '../question/components/FeedbackOverlay';
import { useTestStore } from '../../stores/useTestStore';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing, borderRadius } from '../../core/constants/spacing';
import type { RootStackParamList } from '../../app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ReviewMistakes'>;

export function ReviewMistakesScreen() {
  const navigation = useNavigation<NavProp>();
  const results = useTestStore((s) => s.results);
  const questions = useTestStore((s) => s.questions);
  const clearSession = useTestStore((s) => s.clearSession);

  const [currentIndex, setCurrentIndex] = useState(0);

  const incorrectQuestions = useMemo(() => {
    if (!results) return [];
    return results.incorrectQuestionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as typeof questions;
  }, [results, questions]);

  if (incorrectQuestions.length === 0 || !results) {
    return (
      <SafeScreen>
        <View style={styles.centered}>
          <Text style={styles.noMistakes}>No mistakes to review!</Text>
        </View>
      </SafeScreen>
    );
  }

  const question = incorrectQuestions[currentIndex];
  const userAnswer = results.userAnswers[question.id];
  const isLast = currentIndex === incorrectQuestions.length - 1;
  const isCorrect = userAnswer === question.correctAnswer;

  const handleNext = () => {
    if (isLast) {
      clearSession();
      navigation.navigate('Home');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Mistake {currentIndex + 1} of {incorrectQuestions.length}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard
          questionText={question.questionText}
          imageRef={question.imageRef}
        />

        <AnswerList
          options={[...question.options]}
          selectedAnswer={userAnswer}
          correctAnswer={question.correctAnswer}
          showFeedback={true}
          onSelect={() => {}}
          disabled={true}
        />

        <FeedbackOverlay
          isCorrect={isCorrect}
          explanation={question.explanation}
          referenceSection={question.referenceSection}
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>
            {isLast ? 'Done' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  progress: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progressText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMistakes: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  nextButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});
