import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ServiceCardProps {
  icon: string;
  title: string;
  description?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ServiceCard = ({ icon, title, description, onPress, style }: ServiceCardProps) => {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 15,
      padding: 16,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      flex: 1,
      margin: 8,
      minHeight: 120,
    },
    iconContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    icon: {
      fontSize: 24,
      color: colors.text
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </TouchableOpacity>
  );
};