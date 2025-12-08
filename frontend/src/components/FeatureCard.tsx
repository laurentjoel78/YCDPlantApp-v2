import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme';

interface FeatureCardProps {
  title: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  icon,
  onPress,
  disabled = false
}) => {
  const theme = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`Navigate to ${title}`}
    >
      <Icon name={icon} size={32} color={disabled ? theme.colors.disabled : theme.colors.primary} />
      <Text
        style={[
          styles.title,
          { color: disabled ? theme.colors.disabled : theme.colors.text }
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default FeatureCard;