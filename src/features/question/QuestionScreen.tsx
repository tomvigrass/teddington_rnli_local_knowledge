import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeScreen } from '../../components/SafeScreen';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { ProgressIndicator } from './components/ProgressIndicator';
import { QuestionCard } from './components/QuestionCard';
import { AnswerList } from './components/AnswerList';
import { FeedbackOverlay } from './components/FeedbackOverlay';
import { HideQuestionButton } from './components/HideQuestionButton';
import { useTestSession } from './hooks/useTestSession';
import { useEndlessSession } from './hooks/useEndlessSession';
import { useTestStore } from '../../stores/useTestStore';
import { useHiddenQuestionsStore } from '../../stores/useHiddenQuestionsStore';
import { getReplacementQuestion } from '../../services/TestGeneratorService';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing, borderRadius } from '../../core/constants/spacing';
import type { RootStackParamList } from '../../app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Question'>;
type RoutePropType = RouteProp<RootStackParamList, 'Question'>;

export function QuestionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { mode, categories } = route.params;

  if (mode === 'endless') {
    return <EndlessQuestionView categories={categories} />;
  }

  return <TestQuestionView />;
}

function TestQuestionView() {
  const navigation = useNavigation<NavProp>();
  const [showExitModal, setShowExitModal] = useState(false);
  const hideQuestion = useHiddenQuestionsStore((s) => s.hideQuestion);
  const replaceQuestion = useTestStore((s) => s.replaceQuestion);
  const removeQuestion = useTestStore((s) => s.removeQuestion);
  const storeQuestions = useTestStore((s) => s.questions);
  const session = useTestStore((s) => s.session);

  const {
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    totalQuestions,
    currentIndex,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleComplete,
  } = useTestSession();

  if (!currentQuestion) {
    return (
      <SafeScreen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No questions available</Text>
        </View>
      </SafeScreen>
    );
  }

  const handleHideQuestion = () => {
    hideQuestion(currentQuestion.id);
    const hiddenIds = useHiddenQuestionsStore.getState().hiddenIds;
    const existingIds = session?.questionIds ?? [];
    // Infer categories from current test's questions for custom tests
    const categories = [...new Set(storeQuestions.map((q) => q.category))];
    const replacement = getReplacementQuestion(
      [...existingIds, currentQuestion.id],
      hiddenIds,
      categories
    );
    if (replacement) {
      replaceQuestion(currentIndex, replacement);
    } else {
      removeQuestion(currentIndex);
    }
  };

  const handleFinish = () => {
    handleComplete();
    navigation.navigate('Results');
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    navigation.navigate('Home');
  };

  return (
    <SafeScreen>
      <View style={styles.topBar}>
        <HideQuestionButton onHide={handleHideQuestion} />
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ProgressIndicator
        current={currentIndex + 1}
        total={totalQuestions}
        mode="test"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard
          questionText={currentQuestion.questionText}
          imageRef={currentQuestion.imageRef}
        />

        <AnswerList
          options={[...currentQuestion.options]}
          selectedAnswer={currentAnswer}
          showFeedback={false}
          onSelect={handleAnswer}
        />
      </ScrollView>

      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[styles.navButton, styles.finishButton]}
            onPress={handleFinish}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConfirmationModal
        visible={showExitModal}
        title="Exit Test?"
        message="Your progress will be lost. Are you sure you want to exit?"
        confirmText="Exit"
        cancelText="Continue"
        onConfirm={confirmExit}
        onCancel={() => setShowExitModal(false)}
      />
    </SafeScreen>
  );
}

function EndlessQuestionView({ categories }: { categories?: import('../../models').QuestionCategory[] }) {
  const navigation = useNavigation<NavProp>();
  const [showExitModal, setShowExitModal] = useState(false);
  const hideQuestion = useHiddenQuestionsStore((s) => s.hideQuestion);

  const {
    currentQuestion,
    selectedAnswer,
    showFeedback,
    questionsAnswered,
    handleAnswer,
    handleNext,
    endSession,
  } = useEndlessSession(categories);

  if (!currentQuestion) {
    return (
      <SafeScreen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No questions available</Text>
        </View>
      </SafeScreen>
    );
  }

  const handleHideQuestion = () => {
    hideQuestion(currentQuestion.id);
    handleNext();
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <SafeScreen>
      <View style={styles.topBar}>
        <HideQuestionButton onHide={handleHideQuestion} />
        <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.exitButton}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ProgressIndicator current={questionsAnswered} mode="endless" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard
          questionText={currentQuestion.questionText}
          imageRef={currentQuestion.imageRef}
        />

        <AnswerList
          options={[...currentQuestion.options]}
          selectedAnswer={selectedAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          showFeedback={showFeedback}
          onSelect={handleAnswer}
          disabled={showFeedback}
        />

        {showFeedback && (
          <FeedbackOverlay
            isCorrect={isCorrect}
            explanation={currentQuestion.explanation}
            referenceSection={currentQuestion.referenceSection}
          />
        )}
      </ScrollView>

      {showFeedback && (
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.finishButtonText}>Next Question</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmationModal
        visible={showExitModal}
        title="Stop Practicing?"
        message={`You've answered ${questionsAnswered} questions. Exit to home?`}
        confirmText="Exit"
        cancelText="Continue"
        onConfirm={() => {
          endSession();
          setShowExitModal(false);
          navigation.navigate('Home');
        }}
        onCancel={() => setShowExitModal(false)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  exitButton: {
    padding: spacing.sm,
  },
  exitText: {
    ...typography.bodyMedium,
    color: colors.error,
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
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  navButtons: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
    minHeight: 50,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  navButtonTextDisabled: {
    color: colors.textTertiary,
  },
  finishButton: {
    backgroundColor: colors.primary,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  finishButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});
