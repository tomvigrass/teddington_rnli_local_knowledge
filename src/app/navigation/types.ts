import { TestMode, QuestionCategory } from '../../models';

export type RootStackParamList = {
  Home: undefined;
  CustomSetup: undefined;
  CategoryFilter: { mode: 'customTest' | 'endless' };
  Question: { mode: TestMode; categories?: QuestionCategory[] };
  Results: undefined;
  ReviewMistakes: undefined;
  ThamesMap: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
