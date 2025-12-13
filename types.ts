export enum ViewState {
  FEED = 'FEED',
  YOU = 'YOU'
}

export enum LogType {
  WORKOUT = 'Workout',
  REST = 'Rest',
  REFLECT = 'Reflect'
}

export enum WorkoutType {
  PUSH = 'Push',
  PULL = 'Pull',
  LEGS = 'Legs',
  UPPER = 'Upper',
  FULL_BODY = 'Full Body',
  CARDIO = 'Cardio',
  CUSTOM = 'Custom'
}

export interface LogEntry {
  id: number;
  type: LogType;
  workoutType?: WorkoutType;
  reason?: string;
  note: string;
  isPublicNote: boolean;
  photoUrl?: string;
  isPublicPhoto: boolean;
  username: string;
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
}