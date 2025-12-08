import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Category {
  id: string;
  name: string;
}

interface CategoriesSliderProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const CategoriesSlider = ({ categories, selectedId, onSelect }: CategoriesSliderProps) => {
  const { colors } = useTheme();

  const chipStyle = (isSelected: boolean) => ({
    ...styles.chip,
    backgroundColor: isSelected ? colors.primary : colors.surface,
    borderColor: isSelected ? colors.primary : colors.border,
  });

  const textStyle = (isSelected: boolean) => ({
    ...styles.text,
    color: isSelected ? colors.surface : colors.textSecondary,
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedId === category.id;
        return (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={chipStyle(isSelected)}
          >
            <Text style={textStyle(isSelected)}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});