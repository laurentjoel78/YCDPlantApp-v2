// API Configuration
export const API_BASE_URL = 'http://192.168.56.1:3000/api';
export const SOCKET_URL = 'http://192.168.56.1:3000';

// Theme Configuration
export const DEFAULT_THEME = 'light';

// Navigation Constants
export const ROUTES = {
  HOME: 'Home',
  LOGIN: 'Login',
  REGISTER: 'Register',
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
  DISEASE_DETECTION: 'DiseaseDetection',
  WEATHER: 'Weather',
  MARKETPLACE: 'Marketplace',
  AI_ASSISTANT: 'AIAssistant',
  FORUMS: 'Forums',
  FARM_GUIDELINES: 'FarmGuidelines',
  GUIDELINE_DETAILS: 'GuidelineDetails'
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

// Validation Constants
export const PASSWORD_MIN_LENGTH = 8;
export const NAME_MIN_LENGTH = 2;

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    RESET_PASSWORD: '/auth/reset-password'
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile/update',
    CHANGE_PASSWORD: '/user/change-password'
  },
  FARM: {
    LIST: '/farms',
    DETAILS: (id: string) => `/farms/${id}`,
    CREATE: '/farms',
    UPDATE: (id: string) => `/farms/${id}`,
    DELETE: (id: string) => `/farms/${id}`
  },
  GUIDELINES: {
    LIST: '/guidelines',
    DETAILS: (id: string) => `/guidelines/${id}`,
    UPDATE: (id: string) => `/guidelines/${id}`
  }
} as const;