import { DefaultTheme } from 'react-native-paper';

export interface Theme {
  colors: {
    primary: string;
    surface: string;
    background: string;
    text: string;
    error: string;
    disabled: string;
    onError: string;
    errorContainer: string;
    placeholder: string;
  };
}

export const theme: Theme = {
  colors: {
    ...DefaultTheme.colors,
    primary: '#2D5016',
    surface: '#FFFFFF',
    background: '#F3F4F6',
    text: '#1F2937',
    error: '#DC2626',
    disabled: '#9CA3AF',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    placeholder: '#9CA3AF',
  },
};

export const useTheme = (): Theme => {
  return theme;
};