import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Expert } from '../types/experts';

interface ExpertCardProps {
  expert: Expert;
  onPress: (expert: Expert) => void;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, onPress }) => {
  const { colors } = useTheme();

  // Safe access to availability - handle undefined or different structures
  const isAvailableNow = expert.availability?.days?.includes(getCurrentDay()) ?? false;

  // Safe defaults for potentially undefined values
  const expertName = expert.name || 'Unknown Expert';
  const expertSpecialty = expert.specialty || 'General';
  const expertRating = typeof expert.rating === 'number' ? expert.rating : parseFloat(String(expert.rating)) || 0;
  const expertExperience = expert.experience || 'N/A';
  // Parse consultationFee - handle both number and string from API
  const rawFee = expert.consultationFee ?? (expert as any).consultationPrice ?? 0;
  const expertFee = typeof rawFee === 'number' ? rawFee : (parseFloat(String(rawFee)) || 0);
  const expertLanguages = Array.isArray(expert.languages) ? expert.languages : [];
  const expertImage = expert.image || (expert as any).imageUrl || 'https://via.placeholder.com/60';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => onPress(expert)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: expertImage }} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {expertName}
            </Text>
            <Text style={[styles.specialty, { color: colors.textSecondary }]} numberOfLines={1}>
              {expertSpecialty}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color={colors.warning} />
            <Text style={[styles.rating, { color: colors.text }]}>
              {expertRating.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Icon name="briefcase-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {expertExperience}
            </Text>
          </View>
          <View style={styles.detail}>
            <Icon name="clock-outline" size={16} color={colors.success} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {expertFee.toLocaleString()} FCFA/hr
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.languagesContainer}>
            {expertLanguages.slice(0, 2).map((lang, index) => (
              <Text
                key={lang || index}
                style={[styles.language, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {lang}{index < Math.min(expertLanguages.length, 2) - 1 ? ', ' : ''}
              </Text>
            ))}
            {expertLanguages.length > 2 && (
              <Text style={[styles.language, { color: colors.textSecondary }]}>
                +{expertLanguages.length - 2}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.availabilityBadge,
              {
                backgroundColor: isAvailableNow ? colors.successLight : colors.warningLight,
              },
            ]}
          >
            <Text
              style={[
                styles.availabilityText,
                {
                  color: isAvailableNow ? colors.success : colors.warning,
                },
              ]}
            >
              {isAvailableNow ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

function getCurrentDay(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  specialty: {
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languagesContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  language: {
    fontSize: 12,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
