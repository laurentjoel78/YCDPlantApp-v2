import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText, Portal, Modal } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';

// Cameroon-specific soil types based on regions
const CAMEROON_SOIL_TYPES = [
  'Volcanic (Western Highlands)',
  'Ferralitic (South/Center)',
  'Alluvial (Coastal)',
  'Sandy-Clay (Northern)',
  'Vertisols (Far North)',
  'Andosols (Mount Cameroon)',
  'Hydromorphic (Flood Plains)',
  'Ferruginous (Adamawa)'
];

const FARMING_TYPES = ['conventional', 'organic', 'mixed'] as const;
const WATER_SOURCES = ['Rain-fed', 'River/Stream', 'Borehole', 'Dam/Reservoir', 'Other'];

export type FarmDetails = {
  name: string;
  description?: string;
  location_lat: number;
  location_lng: number;
  address: string;
  region: string;
  size: number;
  soil_type: string;
  water_source: string;
  farming_type: typeof FARMING_TYPES[number];
};

type Props = {
  value: Partial<FarmDetails>;
  onChange: (details: Partial<FarmDetails>) => void;
  errors?: Partial<Record<keyof FarmDetails, string>>;
};

export default function FarmDetailsForm({ value, onChange, errors }: Props) {
  const [mapVisible, setMapVisible] = useState(false);
  const { colors } = useTheme();

  const handleLocationSelect = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onChange({
      ...value,
      location_lat: latitude,
      location_lng: longitude
    });
    setMapVisible(false);
  };

  return (
    <View>
      <TextInput
        label="Farm Name"
        value={value.name}
        onChangeText={(text) => onChange({ ...value, name: text })}
        mode="outlined"
        error={!!errors?.name}
        style={styles.input}
      />
      {errors?.name && <HelperText type="error">{errors.name}</HelperText>}

      <TextInput
        label="Description"
        value={value.description}
        onChangeText={(text) => onChange({ ...value, description: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Button 
        mode="outlined"
        onPress={() => setMapVisible(true)}
        icon="map-marker"
        style={styles.input}
      >
        {value.location_lat ? 'Change Location' : 'Select Location'}
      </Button>
      {(errors?.location_lat || errors?.location_lng) && (
        <HelperText type="error">Please select a location</HelperText>
      )}

      <TextInput
        label="Address"
        value={value.address}
        onChangeText={(text) => onChange({ ...value, address: text })}
        mode="outlined"
        error={!!errors?.address}
        style={styles.input}
      />
      {errors?.address && <HelperText type="error">{errors.address}</HelperText>}

      <TextInput
        label="Region"
        value={value.region}
        onChangeText={(text) => onChange({ ...value, region: text })}
        mode="outlined"
        error={!!errors?.region}
        style={styles.input}
      />
      {errors?.region && <HelperText type="error">{errors.region}</HelperText>}

      <TextInput
        label="Size (hectares)"
        value={value.size?.toString()}
        onChangeText={(text) => {
          const num = parseFloat(text);
          if (!isNaN(num)) {
            onChange({ ...value, size: num });
          }
        }}
        keyboardType="numeric"
        mode="outlined"
        error={!!errors?.size}
        style={styles.input}
      />
      {errors?.size && <HelperText type="error">{errors.size}</HelperText>}

      <Text style={styles.label}>Soil Type</Text>
      <View style={styles.buttonGroup}>
        {CAMEROON_SOIL_TYPES.map((type) => (
          <Button
            key={type}
            mode={value.soil_type === type ? 'contained' : 'outlined'}
            onPress={() => onChange({ ...value, soil_type: type })}
            style={styles.choiceButton}
            buttonColor={value.soil_type === type ? colors.primary : undefined}
          >
            {type}
          </Button>
        ))}
      </View>
      {errors?.soil_type && <HelperText type="error">{errors.soil_type}</HelperText>}

      <Text style={styles.label}>Water Source</Text>
      <View style={styles.buttonGroup}>
        {WATER_SOURCES.map((source) => (
          <Button
            key={source}
            mode={value.water_source === source ? 'contained' : 'outlined'}
            onPress={() => onChange({ ...value, water_source: source })}
            style={styles.choiceButton}
            buttonColor={value.water_source === source ? colors.primary : undefined}
          >
            {source}
          </Button>
        ))}
      </View>
      {errors?.water_source && <HelperText type="error">{errors.water_source}</HelperText>}

      <Text style={styles.label}>Farming Type</Text>
      <View style={styles.buttonGroup}>
        {FARMING_TYPES.map((type) => (
          <Button
            key={type}
            mode={value.farming_type === type ? 'contained' : 'outlined'}
            onPress={() => onChange({ ...value, farming_type: type })}
            style={styles.choiceButton}
            buttonColor={value.farming_type === type ? colors.primary : undefined}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </View>
      {errors?.farming_type && <HelperText type="error">{errors.farming_type}</HelperText>}

      <Portal>
        <Modal visible={mapVisible} onDismiss={() => setMapVisible(false)} contentContainerStyle={styles.mapModal}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: value.location_lat || 7.3697,  // Cameroon center
              longitude: value.location_lng || 12.3547,
              latitudeDelta: 10,
              longitudeDelta: 10,
            }}
            onPress={handleLocationSelect}
          >
            {value.location_lat && value.location_lng && (
              <Marker
                coordinate={{
                  latitude: value.location_lat,
                  longitude: value.location_lng,
                }}
              />
            )}
          </MapView>
          <Button onPress={() => setMapVisible(false)}>Close</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  choiceButton: {
    margin: 4,
  },
  mapModal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 12,
  },
});