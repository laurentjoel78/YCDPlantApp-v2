import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api, request } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../hooks';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ForumTopic } from '../types/forum';

interface UserProfile {
  user: {
    farms?: Array<{
      location_lat: number;
      location_lng: number;
    }>;
  };
}

type RootStackParamList = {
  TopicDetails: { topicId: number };
  NewTopic: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function NearbyTopics() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const formatDistance = (meters: number | undefined) => {
    if (!meters) return 'Unknown distance';
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const fetchNearbyTopics = useCallback(async () => {
    if (!token) {
      setError('Please log in to view nearby discussions');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get current user's farm location
      const profile = await api.auth.profile(token) as UserProfile;
      if (!profile.user?.farms?.[0]) {
        setError('No farm location available');
        setLoading(false);
        return;
      }

      const farm = profile.user.farms[0];
      // Search topics near the farm
      const queryParams = new URLSearchParams({
        latitude: farm.location_lat.toString(),
        longitude: farm.location_lng.toString(),
        radius: '50000',
        includeDistance: 'true'
      });
      
      const result = await request<{ success: boolean; data: { topics: ForumTopic[] } }>(
        `/forums/nearby?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const sortedTopics = result.data.topics.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setTopics(sortedTopics);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch nearby topics:', err);
      setError('Failed to load nearby discussions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNearbyTopics();
  }, [fetchNearbyTopics]);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert" size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading nearby discussions...</Text>
        </View>
      ) : (
        <>
          {topics.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="forum-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No nearby discussions found</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {topics.map(topic => (
                <Pressable 
                  key={topic.id}
                  style={({pressed}) => [
                    styles.topicCard,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => navigation.navigate('TopicDetails', { topicId: parseInt(topic.id, 10) })}
                >
                  <View style={styles.topicHeader}>
                    <Text style={[styles.topicTitle, { color: colors.primary }]}>{topic.title}</Text>
                    <Text style={styles.distance}>{formatDistance(topic.distance)}</Text>
                  </View>
                  
                  <View style={styles.topicContent}>
                    <Text style={[styles.topicPreview, { color: colors.text }]} numberOfLines={2}>
                      {topic.description}
                    </Text>
                    
                    <View style={styles.topicFooter}>
                      <Text style={[styles.metadata, { color: colors.textSecondary }]}>
                        By {topic.author?.name || 'Unknown'} • {
                          new Date((topic as any).created_at || topic.createdAt).toLocaleDateString()
                        }
                      </Text>
                      <View style={styles.stats}>
                        <Text style={styles.statItem}>
                          💬 {(topic as any).commentsCount || 0}
                        </Text>
                        <Text style={styles.statItem}>
                          ❤️ {(topic as any).likesCount || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('NewTopic')}
        color="white"
        customSize={56}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: '#FEF2F2',
    margin: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  topicCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 14,
    color: '#6B7280',
  },
  topicContent: {
    gap: 8,
  },
  topicPreview: {
    fontSize: 16,
    lineHeight: 24,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metadata: {
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    fontSize: 14,
    color: '#6B7280',
  },
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
  }
});