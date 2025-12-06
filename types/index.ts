export interface User {
  id: string;
  username: string;
  email: string;
  rank: string;
  points: number;
  answers: number;
  thanks: number;
  avatar?: string;
  joinedAt: Date;
}

export interface Question {
  id: string;
  userId: string;
  subject: string;
  title: string;
  content: string;
  imageUrl?: string;
  points: number;
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  isExpert: boolean;
  isBrainliest: boolean;
  likes: number;
  hasAudio: boolean;
  audioUrl?: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  hasAudio: boolean;
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  hasAudio: boolean;
  audioUrl?: string;
  timestamp: Date;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}