import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2D5016',      // Vert forêt - Croissance
    secondary: '#4A7C2C',    // Vert feuillage - Nature
    accent: '#FF8C42',      // Orange terre - Énergie
    background: '#F8FAF5',   // Blanc cassé naturel
    surface: '#FFFFFF',      // Blanc pur
    text: '#1A1A1A',        // Noir profond
    placeholder: '#6B7280',  // Gris moyen
    border: '#E5E7EB',      // Gris clair
    success: '#16A34A',     // Vert succès
    warning: '#F59E0B',     // Orange attention
    error: '#DC2626',       // Rouge erreur
    info: '#2563EB',        // Bleu information
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};