import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { guidelineService, FarmGuideline, GuidelineTemplate } from '../services/guidelineService';
import { useApp } from '../store/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FarmGuidelinesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<FarmGuideline[]>([]);
  const [recommendations, setRecommendations] = useState<GuidelineTemplate[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
  const farmId = user?.farms?.[0]?.id;
      const [guidelinesRes, recommendationsRes] = await Promise.all([
        farmId ? guidelineService.getFarmGuidelines(farmId) : Promise.resolve({ guidelines: [] as FarmGuideline[] }),
        farmId ? guidelineService.getRecommendations(farmId) : Promise.resolve({ recommendations: [] as GuidelineTemplate[] })
      ]);
      setGuidelines(guidelinesRes.guidelines || []);
      setRecommendations(recommendationsRes.recommendations || []);
    } catch (err) {
      console.error('Error loading guidelines:', err);
      setError('Failed to load farm guidelines');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.primary;
      case 'completed':
          return (colors as any).success || colors.primary;
        case 'archived':
          return (colors as any).disabled || colors.primary;
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadData}>Retry</Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Guidelines</Text>
        {guidelines.filter(g => g.status === 'active').length === 0 ? (
          <Text style={styles.emptyText}>No active guidelines</Text>
        ) : (
          guidelines
            .filter(g => g.status === 'active')
            .map(guideline => (
              <Card key={guideline.id} style={styles.card} mode="outlined">
                <Card.Content>
                  <Text style={styles.cardTitle}>{guideline.template.name}</Text>
                  <Text style={styles.cardDescription}>
                    {guideline.template.description}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { width: `${guideline.progress}%`, backgroundColor: colors.primary }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{`${guideline.progress}% Complete`}</Text>
                  <View style={styles.chips}>
                    <Chip icon="calendar" style={styles.chip}>
                      Due {new Date(guideline.targetDate).toLocaleDateString()}
                    </Chip>
                    <Chip 
                      icon="information"
                      style={[styles.chip, { backgroundColor: getStatusColor(guideline.status) }]}
                    >
                      {guideline.status.charAt(0).toUpperCase() + guideline.status.slice(1)}
                    </Chip>
                  </View>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => {/* TODO: Navigate to details */}}>View Details</Button>
                  <Button 
                    mode="contained"
                    onPress={() => {/* TODO: Mark as complete */}}
                  >
                    Update Progress
                  </Button>
                </Card.Actions>
              </Card>
            ))
        )}
      </View>

      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Guidelines</Text>
          {recommendations.map(template => (
            <Card key={template.id} style={styles.card} mode="outlined">
              <Card.Content>
                <Text style={styles.cardTitle}>{template.name}</Text>
                <Text style={styles.cardDescription}>{template.description}</Text>
                <View style={styles.chips}>
                  {template.soilTypes.map(type => (
                    <Chip key={type} style={styles.chip} icon="grass">
                      {type}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained"
                  onPress={() => {/* TODO: Add guideline */}}
                >
                  Add Guideline
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginVertical: 24,
  },
});