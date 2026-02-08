import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeScreen } from '../../components/SafeScreen';
import { CategoryCheckbox } from './components/CategoryCheckbox';
import { QuestionCountPicker } from './components/QuestionCountPicker';
import { useTestStore } from '../../stores/useTestStore';
import { useHiddenQuestionsStore } from '../../stores/useHiddenQuestionsStore';
import { generateCustomTest } from '../../services/TestGeneratorService';
import { getCategories } from '../../services/QuestionService';
import { QuestionCategory } from '../../models';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing, borderRadius } from '../../core/constants/spacing';
import type { RootStackParamList } from '../../app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CustomSetup'>;

export function CustomSetupScreen() {
  const navigation = useNavigation<NavProp>();
  const startSession = useTestStore((s) => s.startSession);
  const hiddenIds = useHiddenQuestionsStore((s) => s.hiddenIds);
  const categories = getCategories(hiddenIds);

  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>(
    categories.map((c) => c.questionCategory)
  );
  const [questionCount, setQuestionCount] = useState(20);

  const toggleCategory = (category: QuestionCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleStart = () => {
    if (selectedCategories.length === 0) return;
    const questions = generateCustomTest(selectedCategories, questionCount, hiddenIds);
    if (questions.length === 0) return;
    startSession('customTest', questions);
    navigation.navigate('Question', { mode: 'customTest' });
  };

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categories}>
          {categories.map((cat) => (
            <CategoryCheckbox
              key={cat.id}
              name={cat.name}
              color={cat.color}
              questionCount={cat.questionCount}
              selected={selectedCategories.includes(cat.questionCategory)}
              onToggle={() => toggleCategory(cat.questionCategory)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Number of Questions</Text>
        <QuestionCountPicker
          value={questionCount}
          onChange={setQuestionCount}
        />

        <TouchableOpacity
          style={[
            styles.startButton,
            selectedCategories.length === 0 && styles.startButtonDisabled,
          ]}
          onPress={handleStart}
          disabled={selectedCategories.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Start custom test"
        >
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  categories: {
    gap: spacing.sm,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.xl,
    minHeight: 50,
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  startButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});
