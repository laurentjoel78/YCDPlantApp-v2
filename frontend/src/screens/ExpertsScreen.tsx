import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { ExpertCard } from '../components/ExpertCard';
import { ExpertProfile } from '../components/ExpertProfile';
import { SearchBar } from '../components/SearchBar';
import { Expert } from '../types/experts';
import { ExpertService } from '../services/expertService';
import { FadeInView } from '../components/AnimatedViews';
import { useSocket } from '../context/SocketContext';
import { cacheService, CACHE_KEYS } from '../services/cacheService';

const ExpertsScreen = () => {
  const { colors } = useTheme();
  const { subscribe } = useSocket();
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from cache on mount
  useEffect(() => {
    const cachedExperts = cacheService.get<Expert[]>(CACHE_KEYS.EXPERTS);
    if (cachedExperts && cachedExperts.length > 0) {
      setExperts(cachedExperts);
      setLoading(false);
    }
    setIsInitialized(true);
  }, []);

  const loadExperts = useCallback(async () => {
    try {
      const data = await ExpertService.getExperts();
      setExperts(data);
      cacheService.set(CACHE_KEYS.EXPERTS, data); // Update cache
    } catch (error) {
      console.error('Failed to load experts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load fresh data after initialization
  useEffect(() => {
    if (isInitialized) {
      loadExperts();
    }
  }, [isInitialized, loadExperts]);

  useEffect(() => {
    const events = ['EXPERT_CREATE', 'EXPERT_UPDATE', 'USER_UPDATE'];
    const unsubscribers = events.map(event =>
      subscribe(event, () => {
        cacheService.invalidate(CACHE_KEYS.EXPERTS);
        loadExperts();
      })
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, loadExperts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cacheService.invalidate(CACHE_KEYS.EXPERTS);
    loadExperts();
  }, [loadExperts]);

  const handleExpertPress = (expert: Expert) => {
    setSelectedExpert(expert);
  };

  const handleCloseProfile = () => {
    setSelectedExpert(null);
  };

  const handleBookConsultation = () => {
    console.log('Booking consultation with:', selectedExpert?.name);
    handleCloseProfile();
  };

  const filteredExperts = experts.filter(expert =>
    (expert.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expert.specialty || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading experts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or specialty..."
        />
      </View>

      <FlatList
        data={filteredExperts}
        renderItem={({ item }) => (
          <FadeInView>
            <ExpertCard
              expert={item}
              onPress={() => handleExpertPress(item)}
            />
          </FadeInView>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <Modal
        visible={!!selectedExpert}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseProfile}
      >
        {selectedExpert && (
          <ExpertProfile
            expert={selectedExpert}
            onClose={handleCloseProfile}
            onBook={handleBookConsultation}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
  }
});

export default ExpertsScreen;