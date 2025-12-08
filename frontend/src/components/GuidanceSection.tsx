import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView } from './AnimatedViews';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface GuidanceSectionProps {
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
}

export const GuidanceSection: React.FC<GuidanceSectionProps> = ({
  title,
  description,
  icon,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <FadeInView>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, { backgroundColor: colors.surface }]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
});