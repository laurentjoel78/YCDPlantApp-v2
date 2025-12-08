import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, Button, ProgressBar, Card, ActivityIndicator, TextInput, Chip } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { guidelineService, FarmGuideline } from '../services/guidelineService';
import { useTheme } from '../theme/ThemeContext';

type RootStackParamList = {
  GuidelineDetails: {
    guidelineId: string;
  };
};

type GuidelineDetailsScreenRouteProp = RouteProp<RootStackParamList, 'GuidelineDetails'>;

export default function FarmGuidelineDetailsScreen() {
  const route = useRoute<GuidelineDetailsScreenRouteProp>();
  const navigation = useNavigation() as any;
  const { colors } = useTheme();
  const { guidelineId } = route.params;

  const [guideline, setGuideline] = useState<FarmGuideline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadGuideline();
  }, [guidelineId]);

  const loadGuideline = async () => {
    try {
      setError(null);
      const response = await guidelineService.getGuideline(guidelineId);
      const g = 'guideline' in response ? response.guideline : (response as any);
      setGuideline(g);
      setProgress(g.progress);
      setNotes(g.notes || '');
    } catch (err) {
      console.error('Error loading guideline:', err);
      setError('Failed to load guideline details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!guideline) return;

    try {
      setUpdating(true);
      setError(null);

      const updatedGuideline = await guidelineService.updateGuideline(guidelineId, {
        progress,
        notes,
        status: progress === 100 ? 'completed' : 'active'
      });

      setGuideline(updatedGuideline.guideline);
      navigation.goBack();
    } catch (err) {
      console.error('Error updating guideline:', err);
      setError('Failed to update guideline');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !guideline) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error || 'Guideline not found'}</Text>
        <Button onPress={loadGuideline}>Retry</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{guideline.template.name}</Text>
        <Chip 
          icon={guideline.status === 'completed' ? 'check-circle' : 'progress-clock'}
          style={[
            styles.statusChip,
            { backgroundColor: guideline.status === 'completed' ? (colors as any).success || colors.primary : colors.primary }
          ]}
        >
          {guideline.status.charAt(0).toUpperCase() + guideline.status.slice(1)}
        </Chip>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{guideline.template.description}</Text>

          <View style={styles.dates}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>
                {new Date(guideline.startDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Target Date</Text>
              <Text style={styles.dateValue}>
                {new Date(guideline.targetDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Text style={styles.progressLabel}>Progress: {progress}%</Text>
          <ProgressBar
            progress={progress / 100}
            color={colors.primary}
            style={styles.progressBar}
          />

          <View style={styles.sliderContainer}>
            <Button 
              mode="outlined" 
              onPress={() => setProgress(Math.max(0, progress - 10))}
              disabled={updating}
            >
              -10%
            </Button>
            <TextInput
              value={progress.toString()}
              onChangeText={(text) => {
                const value = parseInt(text);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                  setProgress(value);
                }
              }}
              keyboardType="numeric"
              style={styles.progressInput}
              disabled={updating}
            />
            <Button 
              mode="outlined" 
              onPress={() => setProgress(Math.min(100, progress + 10))}
              disabled={updating}
            >
              +10%
            </Button>
          </View>

          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
            disabled={updating}
          />
        </Card.Content>
      </Card>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <View style={styles.actions}>
        <Button 
          mode="contained" 
          onPress={handleUpdateProgress}
          loading={updating}
          disabled={updating}
          style={styles.updateButton}
        >
          Update Progress
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  statusChip: {
    borderRadius: 16,
  },
  card: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.7,
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressInput: {
    width: 80,
    textAlign: 'center',
  },
  notesInput: {
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginVertical: 16,
  },
  actions: {
    padding: 16,
  },
  updateButton: {
    marginTop: 8,
  },
});