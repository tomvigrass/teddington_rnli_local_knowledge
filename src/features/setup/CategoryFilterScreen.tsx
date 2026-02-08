import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeScreen } from '../../components/SafeScreen';
import { CategoryCheckbox } from './components/CategoryCheckbox';
import { getCategories } from '../../services/QuestionService';
import { useHiddenQuestionsStore } from '../../stores/useHiddenQuestionsStore';
import { QuestionCategory } from '../../models';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing, borderRadius } from '../../core/constants/spacing';
import type { RootStackParamList } from '../../app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryFilter'>;
type RoutePropType = RouteProp<RootStackParamList, 'CategoryFilter'>;

export function CategoryFilterScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { mode } = route.params;
  const hiddenIds = useHiddenQuestionsStore((s) => s.hiddenIds);
  const categories = getCategories(hiddenIds);

  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>(
    categories.map((c) => c.questionCategory)
  );

  const toggleCategory = (category: QuestionCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleStart = () => {
    if (selectedCategories.length === 0) return;
    navigation.navigate('Question', {
      mode,
      categories: selectedCategories,
    });
  };

  const handleStartAll = () => {
    navigation.navigate('Question', { mode });
  };

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Select which categories to include, or skip to use all categories.
        </Text>

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

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleStartAll}
            accessibilityRole="button"
          >
            <Text style={styles.skipButtonText}>Use All Categories</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startButton,
              selectedCategories.length === 0 && styles.startButtonDisabled,
            ]}
            onPress={handleStart}
            disabled={selectedCategories.length === 0}
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>Start with Selected</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  categories: {
    gap: spacing.sm,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  skipButton: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
    justifyContent: 'center',
  },
  skipButtonText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
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
