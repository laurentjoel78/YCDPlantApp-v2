import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Card, Text, Button, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../hooks';
import { cacheService, CACHE_KEYS } from '../services/cacheService';
import CropGuidanceCard from './CropGuidanceCard';
import MarketMapCard from './MarketMapCard';

const SuggestionsCard: React.FC<{ farmId?: string }> = ({ farmId }) => {
  // Use cached suggestions to display immediately
  const cachedData = cacheService.get<any>(CACHE_KEYS.SUGGESTIONS);
  const [loading, setLoading] = useState(!cachedData);
  const [data, setData] = useState<any>(cachedData || null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const tr = t as any;

  const { token, user, isLoading } = useAuth();

  // Get the effective farm ID - either from props or from the first user farm
  const effectiveFarmId = farmId || user?.farms?.[0]?.id;

  useEffect(() => {
    const fetch = async () => {
      try {
        if (isLoading) return;

        // Skip suggestions for admin users or users without farms
        if (user?.role === 'admin') {
          console.log('Skipping suggestions for admin user');
          setLoading(false);
          return;
        }

        if (!user?.email || !effectiveFarmId) {
          console.log('Missing required data:', { email: user?.email, farmId: effectiveFarmId });
          setLoading(false);
          return;
        }

        // Only show loading if no cached data
        if (!data) setLoading(true);
        let json;
        try {
          json = await api.suggestions.get(token || '');
        } catch (authError) {
          json = await api.suggestions.public(effectiveFarmId, user.email);
        }

        if (json) {
          setData(json);
          cacheService.set(CACHE_KEYS.SUGGESTIONS, json, 5 * 60 * 1000); // 5 min TTL
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching suggestions:', err);
        setError(err.message || 'Failed to fetch suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [token, effectiveFarmId, user?.email, isLoading]);

  const handleActionComplete = (advisoryId: string) => {
    console.log('Advisory completed:', advisoryId);
    // TODO: Implement marking advisory as complete
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{tr('suggestions.fetchError', { message: error })}</Text>;

  // Don't show suggestions card for admin users
  if (user?.role === 'admin') {
    return null;
  }

  if (!data) {
    return (
      <Card style={styles.emptyCard}>
        <Card.Content>
          <Text style={styles.title}>{tr('suggestions.title')}</Text>
          <Text style={styles.small}>{tr('suggestions.noData') || 'No suggestions available right now.'}</Text>
        </Card.Content>
      </Card>
    );
  }

  // Group advisories by crop
  const advisoriesByCrop: { [crop: string]: any[] } = {};
  const setupAdvisories: any[] = [];

  (data.advisories || []).forEach((advisory: any) => {
    if (advisory.type === 'setup') {
      setupAdvisories.push(advisory);
    } else if (advisory.crop) {
      if (!advisoriesByCrop[advisory.crop]) {
        advisoriesByCrop[advisory.crop] = [];
      }
      advisoriesByCrop[advisory.crop].push(advisory);
    }
    // Generic non-setup advisories are now ignored as per user request
  });

  const cropNames = Object.keys(advisoriesByCrop);
  const totalAdvisories = (data.advisories || []).length;

  return (
    <ScrollView>
      {/* Summary Header */}
      <Card style={styles.summaryCard} elevation={2}>
        <Card.Content>
          <Text style={styles.heading}>{t('suggestions.title')}</Text>
          <View style={styles.summaryStats}>
            <Chip icon="sprout" style={styles.statChip}>
              {cropNames.length} {cropNames.length === 1 ? 'Crop' : 'Crops'}
            </Chip>
            <Chip icon="alert-circle" style={styles.statChip}>
              {totalAdvisories} {totalAdvisories === 1 ? 'Advisory' : 'Advisories'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Setup Advisories (High Priority) */}
      {setupAdvisories.map((item: any) => (
        <Card key={item.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#F59E0B' }]} elevation={2}>
          <Card.Content>
            <View style={styles.row}>
              <View style={styles.meta}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.detail}>{item.detail}</Text>
              </View>
              <IconButton icon="arrow-right-circle" size={28} iconColor="#F59E0B" onPress={() => handleActionComplete(item.id)} />
            </View>
          </Card.Content>
        </Card>
      ))}

      {/* Crop-specific guidance */}
      {cropNames.length === 0 && setupAdvisories.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.small}>{tr('suggestions.none') || 'No active advisories for your farm at the moment.'}</Text>
          </Card.Content>
        </Card>
      )}

      {cropNames.map(cropName => (
        <CropGuidanceCard
          key={cropName}
          crop={cropName}
          advisories={advisoriesByCrop[cropName]}
          onActionComplete={handleActionComplete}
        />
      ))}



      {/* Nearby Markets */}
      {(data.markets || []).length > 0 && effectiveFarmId && (
        <MarketMapCard
          farmLocation={{
            lat: data.farm_location?.lat || 0,
            lng: data.farm_location?.lng || 0
          }}
          markets={data.markets}
        />
      )}

      {(data.markets || []).length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.title}>{tr('suggestions.nearbyMarkets')}</Text>
            <Text style={styles.small}>{tr('suggestions.noMarkets') || 'No nearby market data available.'}</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statChip: {
    backgroundColor: '#F0FDF4',
  },
  heading: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  card: { marginBottom: 8 },
  advisoryCard: { marginBottom: 8, backgroundColor: '#F9FAFB' },
  emptyCard: { marginBottom: 8, backgroundColor: '#FFFFFF' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  detail: { fontSize: 14, color: '#374151', marginTop: 4 },
  small: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { flex: 1, paddingRight: 8 }
});

export default SuggestionsCard;
