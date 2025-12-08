import { ThemeColors as AppThemeColors } from './colors';

export type ThemeColors = AppThemeColors;

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  roundness: number;
}

export type ThemeType = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}