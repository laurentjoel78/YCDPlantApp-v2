import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Badge,
  Searchbar,
  Button,
  ActivityIndicator,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Expert, ExpertService } from '../services/expertService';
import { useNavigation, NavigationProp, useNavigationState, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

export default function ExpertAdvisoryScreen() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const navigationState = useNavigationState(state => state);
  const { t } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      loadExperts();
      return () => { };
    }, [])
  );

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      const expertsList = await ExpertService.getExperts();
      setExperts(expertsList);
      setFilteredExperts(expertsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading experts:', error);
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = experts.filter(expert =>
      (expert.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (expert.specialization || '').toLowerCase().includes(query.toLowerCase())
    );
    setFilteredExperts(filtered);
  };

  const handleFilter = (specialization: string | null) => {
    setFilter(specialization);
    if (!specialization) {
      setFilteredExperts(experts);
      return;
    }
    const filtered = experts.filter(expert =>
      expert.specialization === specialization
    );
    setFilteredExperts(filtered);
  };

  const handleStartConsultation = async (expert: Expert) => {
    try {
      const consultation = await ExpertService.startConsultation(expert.id);
      setSelectedExpert(null);
      setTimeout(() => {
        navigation.navigate('ConsultationChat', {
          consultationId: consultation.id,
          expert,
        });
      }, 100);
    } catch (error) {
      console.error('Error starting consultation:', error);
    }
  };

  const getAvailabilityColor = (availability: Expert['availability']) => {
    switch (availability) {
      case 'available':
        return '#10B981';
      case 'busy':
        return '#F59E0B';
      case 'offline':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderExpertCard = (expert: Expert) => (
    <Card
      key={expert.id}
      style={styles.expertCard}
      onPress={() => {
        if (navigationState) {
          setSelectedExpert(expert);
        }
      }}
    >
      <Card.Content style={styles.expertCardContent}>
        <View style={styles.expertHeader}>
          {expert.imageUrl ? (
            <Image
              source={{ uri: expert.imageUrl }}
              style={styles.expertImage}
            />
          ) : (
            <View style={[styles.expertImage, styles.defaultAvatarContainer]}>
              <MaterialCommunityIcons name="account-circle" size={60} color="#666" />
            </View>
          )}
          <View style={styles.expertInfo}>
            <Text style={styles.expertName}>{expert.name}</Text>
            <Text style={styles.expertSpecialization}>
              {expert.specialization}
            </Text>
            <View style={styles.expertStats}>
              <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
              <Text style={styles.rating}>{expert.rating}</Text>
              <Text style={styles.experience}>
                {expert.experience} {t('expert.yearsExp', 'years exp.')}
              </Text>
            </View>
          </View>
          <Badge
            style={[
              styles.availabilityBadge,
              { backgroundColor: getAvailabilityColor(expert.availability) },
            ]}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderExpertModal = () => (
    <Portal>
      <Modal
        visible={!!selectedExpert}
        onDismiss={() => setSelectedExpert(null)}
        contentContainerStyle={styles.modalContent}
      >
        {selectedExpert && (
          <ScrollView>
            {selectedExpert.imageUrl ? (
              <Image
                source={{ uri: selectedExpert.imageUrl }}
                style={styles.modalImage}
              />
            ) : (
              <View style={[styles.modalImage, styles.defaultAvatarContainer]}>
                <MaterialCommunityIcons name="account-circle" size={100} color="#666" />
              </View>
            )}
            <Text style={styles.modalName}>{selectedExpert.name}</Text>
            <Text style={styles.modalSpecialization}>
              {selectedExpert.specialization}
            </Text>

            <View style={styles.modalStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                <Text style={styles.statValue}>{selectedExpert.rating}</Text>
                <Text style={styles.statLabel}>{t('expert.rating', 'Rating')}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color="#2D5016"
                />
                <Text style={styles.statValue}>
                  {selectedExpert.experience}
                </Text>
                <Text style={styles.statLabel}>{t('expert.years', 'Years')}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={20}
                  color="#2D5016"
                />
                <Text style={styles.statValue}>
                  ${selectedExpert.consultationPrice}
                </Text>
                <Text style={styles.statLabel}>{t('expert.perHour', '/ hour')}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('profile.about', 'About')}</Text>
            <Text style={styles.modalBio}>{selectedExpert.bio}</Text>

            <Text style={styles.sectionTitle}>{t('expert.languages', 'Languages')}</Text>
            <View style={styles.languageContainer}>
              {selectedExpert.languages.map((language, index) => (
                <Chip key={index} style={styles.languageChip}>
                  {language}
                </Chip>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => {
                const expertToConsult = selectedExpert;
                setSelectedExpert(null);
                if (expertToConsult) {
                  handleStartConsultation(expertToConsult);
                }
              }}
              style={styles.consultButton}
              disabled={selectedExpert.availability === 'offline'}
            >
              {t('expert.startConsultation', 'Start Consultation')}
            </Button>
          </ScrollView>
        )}
      </Modal>
    </Portal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5016" />
        <Text style={styles.loadingText}>{t('common.loading', 'Loading experts...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('expert.searchPlaceholder', 'Search experts...')}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <Chip
          selected={!filter}
          onPress={() => handleFilter(null)}
          style={styles.filterChip}
        >
          {t('common.all', 'All')}
        </Chip>
        {Array.from(new Set(experts.map(e => e.specialization))).map(
          (specialization, index) => (
            <Chip
              key={index}
              selected={filter === specialization}
              onPress={() => handleFilter(specialization)}
              style={styles.filterChip}
            >
              {specialization}
            </Chip>
          )
        )}
      </ScrollView>

      <ScrollView style={styles.expertsList}>
        {filteredExperts.map(renderExpertCard)}
      </ScrollView>

      {renderExpertModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  expertsList: {
    padding: 16,
  },
  expertCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  expertCardContent: {
    padding: 12,
  },
  expertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  defaultAvatarContainer: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  expertSpecialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  expertStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    marginRight: 8,
    color: '#6B7280',
  },
  experience: {
    color: '#6B7280',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#2D5016',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
  },
  modalSpecialization: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 16,
    marginBottom: 8,
  },
  modalBio: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    backgroundColor: '#E5E7EB',
  },
  consultButton: {
    marginTop: 24,
    backgroundColor: '#2D5016',
  },
});