import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaleInView, FadeInView } from './AnimatedViews';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Expert } from '../types/experts';

interface ExpertProfileProps {
  expert: Expert;
  onClose?: () => void;
  onBook?: () => void;
}

export const ExpertProfile: React.FC<ExpertProfileProps> = ({
  expert,
  onClose,
  onBook,
}) => {
  const { colors } = useTheme();

  // Safe defaults for potentially undefined values
  const expertName = expert?.name || 'Unknown Expert';
  const expertSpecialty = expert?.specialty || 'General';
  const expertRating = typeof expert?.rating === 'number' ? expert.rating : parseFloat(String(expert?.rating)) || 0;
  const expertExperience = expert?.experience || 'N/A';
  const expertBio = expert?.bio || 'No bio available';
  const expertImage = expert?.image || (expert as any)?.imageUrl || 'https://via.placeholder.com/200';
  const expertLanguages = Array.isArray(expert?.languages) ? expert.languages : [];
  const expertCertifications = Array.isArray(expert?.certifications) ? expert.certifications : [];
  const rawFee = expert?.consultationFee ?? (expert as any)?.consultationPrice ?? 0;
  const expertFee = typeof rawFee === 'number' ? rawFee : (parseFloat(String(rawFee)) || 0);

  return (
    <ScaleInView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView bounces={false}>
        {/* Header with Image */}
        <View style={styles.header}>
          <Image source={{ uri: expertImage }} style={styles.coverImage} />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Expert Info */}
        <View style={styles.content}>
          <FadeInView delay={100}>
            <Text style={[styles.name, { color: colors.text }]}>{expertName}</Text>
            <Text style={[styles.specialty, { color: colors.textSecondary }]}>
              {expertSpecialty}
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="star" size={20} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {expertRating.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Rating
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="briefcase" size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {expertExperience}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Experience
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="cash" size={20} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {expertFee.toLocaleString()} FCFA
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Per Hour
                </Text>
              </View>
            </View>

            {/* Bio Section */}
            <View style={[styles.section, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              <Text style={[styles.bio, { color: colors.textSecondary }]}>
                {expertBio}
              </Text>
            </View>

            {/* Languages Section */}
            <View style={[styles.section, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Languages</Text>
              <View style={styles.languagesContainer}>
                {expertLanguages.map((language, index) => (
                  <View
                    key={language || index}
                    style={[styles.languageChip, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.languageText, { color: colors.text }]}>
                      {language}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Certifications Section */}
            {expertCertifications.length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.background }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Certifications
                </Text>
                {expertCertifications.map((cert, index) => (
                  <View key={index} style={styles.certificationItem}>
                    <Icon name="certificate" size={20} color={colors.primary} />
                    <Text
                      style={[styles.certificationText, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {cert}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </FadeInView>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={onBook}
        >
          <Text style={styles.bookButtonText}>Book Consultation</Text>
          <Text style={styles.bookButtonPrice}>{expertFee.toLocaleString()} FCFA/hr</Text>
        </TouchableOpacity>
      </View>
    </ScaleInView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  languageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 14,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  certificationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButtonPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});