import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { GuidanceSection as GuidanceSectionType } from '../types/guidance';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FadeInView } from './AnimatedViews';

interface GuidanceSectionCardProps {
  section: GuidanceSectionType;
  onPress: (section: GuidanceSectionType) => void;
}

export const GuidanceSectionCard: React.FC<GuidanceSectionCardProps> = ({ section, onPress }) => {
  const { colors } = useTheme();

  return (
    <FadeInView>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.surface }]}
        onPress={() => onPress(section)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Icon name={section.icon} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {section.title}
          </Text>
        </View>

        <View style={styles.content}>
          {section.subsections.slice(0, 2).map((subsection) => (
            <View key={subsection.id} style={styles.subsection}>
              <Image
                source={{ uri: subsection.image }}
                style={styles.subsectionImage}
                resizeMode="cover"
              />
              <Text style={[styles.subsectionTitle, { color: colors.text }]} numberOfLines={1}>
                {subsection.title}
              </Text>
              <Text
                style={[styles.subsectionDescription, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {subsection.description}
              </Text>
            </View>
          ))}
        </View>

        {section.subsections.length > 2 && (
          <View style={styles.footer}>
            <Text style={[styles.moreText, { color: colors.primary }]}>
              +{section.subsections.length - 2} more topics
            </Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  subsection: {
    flex: 1,
  },
  subsectionImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  subsectionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  moreText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});