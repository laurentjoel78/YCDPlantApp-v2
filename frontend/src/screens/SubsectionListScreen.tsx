import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Subsection {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  subsections: Subsection[];
}

interface SubsectionListScreenProps {
  route: {
    params: {
      section: Section;
    };
  };
  navigation: any;
}

export default function SubsectionListScreen({ route, navigation }: SubsectionListScreenProps) {
  const { section } = route.params;

  const handleSubsectionPress = (subsection: Subsection) => {
    // Navigate to the subsection detail screen
    navigation.navigate('SubsectionDetail', { 
      sectionTitle: section.title,
      subsection 
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#2D5016" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{section.title}</Text>
          <Icon name={section.icon} size={24} color="#2D5016" />
        </View>
      </View>

      <View style={styles.content}>
        {section.subsections.map((subsection) => (
          <TouchableOpacity
            key={subsection.id}
            style={styles.subsectionCard}
            onPress={() => handleSubsectionPress(subsection)}
          >
            <Image 
              source={{ uri: subsection.image }}
              style={styles.subsectionImage}
            />
            <View style={styles.subsectionInfo}>
              <Text style={styles.subsectionTitle}>{subsection.title}</Text>
              <Text style={styles.subsectionDescription} numberOfLines={2}>
                {subsection.description}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  subsectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subsectionImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  subsectionInfo: {
    flex: 1,
    marginRight: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subsectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});