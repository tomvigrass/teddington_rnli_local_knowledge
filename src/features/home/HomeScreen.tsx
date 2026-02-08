import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeScreen } from '../../components/SafeScreen';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { ModeCard } from './components/ModeCard';
import { LastScoreBadge } from './components/LastScoreBadge';
import { useStatsStore } from '../../stores/useStatsStore';
import { useTestStore } from '../../stores/useTestStore';
import { useHiddenQuestionsStore } from '../../stores/useHiddenQuestionsStore';
import { generateQuickTest } from '../../services/TestGeneratorService';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing } from '../../core/constants/spacing';
import type { RootStackParamList } from '../../app/navigation/types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { lastScore, totalQuestionsAttempted, reset: resetStats } = useStatsStore();
  const startSession = useTestStore((s) => s.startSession);
  const hiddenIds = useHiddenQuestionsStore((s) => s.hiddenIds);
  const unhideAll = useHiddenQuestionsStore((s) => s.unhideAll);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleQuickTest = () => {
    const questions = generateQuickTest(hiddenIds);
    startSession('quickTest', questions);
    navigation.navigate('Question', { mode: 'quickTest' });
  };

  const handleReset = () => {
    unhideAll();
    resetStats();
    setShowResetModal(false);
  };

  const handleCustomTest = () => {
    navigation.navigate('CustomSetup');
  };

  const handleEndlessMode = () => {
    navigation.navigate('CategoryFilter', { mode: 'endless' });
  };

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.word}>
            <Text style={styles.initial}>R</Text>apid
          </Text>
          <Text style={styles.word}>
            <Text style={styles.initial}>N</Text>avigation
          </Text>
          <Text style={styles.word}>
            <Text style={styles.initial}>L</Text>earning
          </Text>
          <Text style={styles.word}>
            <Text style={styles.initial}>I</Text>nterface
          </Text>
          <Text style={styles.subtitle}>Teddington Local Knowledge Exam</Text>
        </View>

        <View style={styles.modes}>
          <ModeCard
            title="Quick Test"
            subtitle="20 random questions"
            onPress={handleQuickTest}
            color={colors.brandBlue}
          />
          <ModeCard
            title="Custom Test"
            subtitle="Choose categories and question count"
            onPress={handleCustomTest}
            color={colors.brandRed}
          />
          <ModeCard
            title="Endless Mode"
            subtitle="Practice with instant feedback"
            onPress={handleEndlessMode}
            color={colors.success}
          />
          <ModeCard
            title="View Thames Map"
            subtitle="Thames river infographic"
            onPress={() => navigation.navigate('ThamesMap')}
            color={colors.brandYellow}
          />
        </View>

        {(lastScore || totalQuestionsAttempted > 0) && (
          <View style={styles.stats}>
            <LastScoreBadge
              correct={lastScore?.correct ?? 0}
              total={lastScore?.total ?? 0}
              totalAttempted={totalQuestionsAttempted}
            />
          </View>
        )}

        {(hiddenIds.length > 0 || totalQuestionsAttempted > 0) && (
          <View style={styles.resetSection}>
            {hiddenIds.length > 0 && (
              <Text style={styles.hiddenCount}>
                {hiddenIds.length} question{hiddenIds.length !== 1 ? 's' : ''} hidden
              </Text>
            )}
            <TouchableOpacity onPress={() => setShowResetModal(true)}>
              <Text style={styles.resetText}>Reset Hidden Questions & Stats</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showResetModal}
        title="Reset Hidden Questions & Stats?"
        message="This will restore all hidden questions and clear your test statistics. This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  word: {
    fontSize: 28,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  initial: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.brandBlue,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  modes: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stats: {
    marginTop: spacing.sm,
  },
  resetSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  hiddenCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resetText: {
    ...typography.caption,
    color: colors.error,
    textDecorationLine: 'underline',
  },
});
