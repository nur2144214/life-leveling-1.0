export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestType = 'daily' | 'special';
export type QuestStatus = 'pending' | 'completed' | 'failed';
export type AttributeType = 'strength' | 'intelligence' | 'creativity' | 'stamina';

export interface UserAttributes {
  strength: number;
  intelligence: number;
  creativity: number;
  stamina: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  goals?: string;
  attributes: UserAttributes;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  attribute: AttributeType;
  xpReward: number;
  type: QuestType;
  status: QuestStatus;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}
