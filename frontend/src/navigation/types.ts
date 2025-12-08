import { ForumCategory } from '../types/forum';
import { Expert } from '../services/expertService';

export type HomeStackParamList = {
  HomeScreen: undefined;
  DiseaseDetection: undefined;
  Weather: undefined;
  ExpertAdvisory: undefined;
  Marketplace: undefined;
  AIAssistant: undefined;
  Forums: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  DiseaseDetection: undefined;
  ConsultationChat: { consultationId: string; expert: Expert };
  ForumDetails: { forumId: string; categoryName: string };
  NewForumPost: { categoryId: string; region: string };
};