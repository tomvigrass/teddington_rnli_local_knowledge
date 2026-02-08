import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../features/home/HomeScreen';
import { CustomSetupScreen } from '../../features/setup/CustomSetupScreen';
import { CategoryFilterScreen } from '../../features/setup/CategoryFilterScreen';
import { QuestionScreen } from '../../features/question/QuestionScreen';
import { ResultsScreen } from '../../features/results/ResultsScreen';
import { ReviewMistakesScreen } from '../../features/review/ReviewMistakesScreen';
import { ThamesMapScreen } from '../../features/map/ThamesMapScreen';
import { colors } from '../../core/constants/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CustomSetup"
        component={CustomSetupScreen}
        options={({ navigation }) => ({
          title: 'Custom Test',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
              <Text style={{ color: colors.white, fontSize: 17 }}>Back</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CategoryFilter"
        component={CategoryFilterScreen}
        options={{ title: 'Select Categories' }}
      />
      <Stack.Screen
        name="Question"
        component={QuestionScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: 'Results', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ReviewMistakes"
        component={ReviewMistakesScreen}
        options={{ title: 'Review Mistakes' }}
      />
      <Stack.Screen
        name="ThamesMap"
        component={ThamesMapScreen}
        options={{ title: 'Thames Map' }}
      />
    </Stack.Navigator>
  );
}
