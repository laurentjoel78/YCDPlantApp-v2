import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  onPress: () => void;
};

export default function AIFAB({ onPress }: Props) {
  const { colors } = useTheme();

  return (
    <FAB
      icon="robot"
      style={[styles.fab, { backgroundColor: colors.primary }]}
      color="white"
      onPress={onPress}
      customSize={56}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
});