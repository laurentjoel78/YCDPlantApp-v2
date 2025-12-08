export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  cardBackground: string;
  shadow: string;
  statusBar: 'light' | 'dark';
  white: string;
  black: string;
  transparent: string;
}

export const lightColors: ThemeColors = {
  primary: '#4CAF50',      // Green
  primaryLight: '#E8F5E9', // Light Green
  secondary: '#2196F3',    // Blue
  secondaryLight: '#E3F2FD', // Light Blue
  background: '#F5F5F5',   // Light Grey
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  text: '#333333',         // Dark Grey
  textSecondary: '#757575', // Medium Grey
  border: '#E0E0E0',       // Light Grey
  error: '#F44336',        // Red
  errorLight: '#FFEBEE',   // Light Red
  success: '#4CAF50',      // Green
  successLight: '#E8F5E9', // Light Green
  warning: '#FFC107',      // Amber
  warningLight: '#FFF8E1', // Light Amber
  info: '#2196F3',         // Blue
  infoLight: '#E3F2FD',    // Light Blue
  cardBackground: '#FFFFFF',
  shadow: '#000000',
  statusBar: 'dark',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const darkColors: ThemeColors = {
  primary: '#81C784',      // Light Green
  primaryLight: '#112811', // Dark Green
  secondary: '#64B5F6',    // Light Blue
  secondaryLight: '#112831', // Dark Blue
  background: '#121212',   // Dark Grey
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#2C2C2C',
  error: '#EF5350',
  errorLight: '#311111',   // Dark Red
  success: '#81C784',
  successLight: '#112811', // Dark Green
  warning: '#FFD54F',
  warningLight: '#312811', // Dark Amber
  info: '#64B5F6',
  infoLight: '#112831',    // Dark Blue
  cardBackground: '#1E1E1E',
  shadow: '#000000',
  statusBar: 'light',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// For backward compatibility
export const colors = lightColors;