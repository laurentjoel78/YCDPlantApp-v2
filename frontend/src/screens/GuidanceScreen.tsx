import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { GuidanceSection } from '../components/GuidanceSection';
import { GuidanceSectionCard } from '../components/GuidanceSectionCard';
import { SearchBar } from '../components/SearchBar';
import { guidanceContent } from '../data/guidanceContent';
import { GuidanceSection as GuidanceSectionType } from '../types/guidance';

const GuidanceScreen = () => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<GuidanceSectionType | null>(null);

  const handleSectionPress = (section: GuidanceSectionType) => {
    setSelectedSection(section);
  };

  const filteredSections = guidanceContent.filter(section =>
    (section.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.subsections?.some(sub =>
      (sub.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderSectionListItem = ({ item }: { item: GuidanceSectionType }) => (
    <GuidanceSection
      title={item.title}
      description={item.subsections[0].description}
      icon={item.icon}
      onPress={() => handleSectionPress(item)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search guidance topics..."
        />
      </View>

      <FlatList
        data={filteredSections}
        renderItem={renderSectionListItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal
        visible={!!selectedSection}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSection(null)}
      >
        {selectedSection && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <GuidanceSectionCard
              section={selectedSection}
              onPress={() => {
                // Handle subsection selection
                console.log('Selected subsection:', selectedSection);
              }}
            />
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    paddingVertical: 8,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
});

export default GuidanceScreen;