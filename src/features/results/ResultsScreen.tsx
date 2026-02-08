import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeScreen } from '../../components/SafeScreen';
import { ScoreDisplay } from './components/ScoreDisplay';
import { PassFailBadge } from './components/PassFailBadge';
import { useTestStore } from '../../stores/useTestStore';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing, borderRadius } from '../../core/constants/spacing';
import type { RootStackParamList } from '../../app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;

export function ResultsScreen() {
  const navigation = useNavigation<NavProp>();
  const results = useTestStore((s) => s.results);
  const clearSession = useTestStore((s) => s.clearSession);

  if (!results) {
    return (
      <SafeScreen>
        <View style={styles.centered}>
          <Text style={styles.noResults}>No results available</Text>
        </View>
      </SafeScreen>
    );
  }

  const handleReviewMistakes = () => {
    navigation.navigate('ReviewMistakes');
  };

  const handleTryAgain = () => {
    clearSession();
    navigation.navigate('Home');
  };

  const handleHome = () => {
    clearSession();
    navigation.navigate('Home');
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.scoreSection}>
          <ScoreDisplay
            correct={results.correctCount}
            total={results.totalQuestions}
          />
          <PassFailBadge passed={results.passed} />
          <Text style={styles.threshold}>Pass threshold: 90%</Text>
        </View>

        <View style={styles.actions}>
          {results.incorrectQuestionIds.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.reviewButton]}
              onPress={handleReviewMistakes}
              accessibilityRole="button"
            >
              <Text style={styles.reviewButtonText}>
                Review Mistakes ({results.incorrectQuestionIds.length})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.tryAgainButton]}
            onPress={handleTryAgain}
            accessibilityRole="button"
          >
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={handleHome}
            accessibilityRole="button"
          >
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  threshold: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  reviewButton: {
    backgroundColor: colors.primary,
  },
  reviewButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  tryAgainButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tryAgainButtonText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  homeButton: {
    backgroundColor: 'transparent',
  },
  homeButtonText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
