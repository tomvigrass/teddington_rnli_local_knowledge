export enum QuestionType {
  TextMultipleChoice = 'textMultipleChoice',
  ImageIdentification = 'imageIdentification',
  Operational = 'operational',
  Safety = 'safety',
  Sequence = 'sequence',
}

export enum QuestionCategory {
  EvacuationPoints = 'evacuationPoints',
  Islands = 'islands',
  Bridges = 'bridges',
  Establishments = 'establishments',
  PointsOfInterest = 'pointsOfInterest',
  RichmondLock = 'richmondLock',
  TeddingtonLock = 'teddingtonLock',
  PLAWarnings = 'plaWarnings',
  EnvironmentAgencyWarnings = 'environmentAgencyWarnings',
  Hazards = 'hazards',
  Locks = 'locks',
}

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface Question {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  difficulty: Difficulty;
  questionText: string;
  correctAnswer: string;
  options: [string, string, string, string];
  explanation: string;
  referenceSection: string;
  imageRef?: string;
}
