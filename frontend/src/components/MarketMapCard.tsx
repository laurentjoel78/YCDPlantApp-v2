import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Linking, Alert } from 'react-native';
import { Card, Text, Button, IconButton, Chip } from 'react-native-paper';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Market {
    id: string;
    name: string;
    location_lat: number;
    location_lng: number;
    distance_km: number;
    operating_hours?: any;
    market_days?: string[];
}

interface MarketMapCardProps {
    farmLocation: { lat: number; lng: number };
    markets: Market[];
}

const MarketMapCard: React.FC<MarketMapCardProps> = ({ farmLocation, markets }) => {
    const { t } = useTranslation();
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('list');

    const handleNavigate = (market: Market) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${market.location_lat},${market.location_lng}`;
        const label = market.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Could not open maps application.');
            });
        }
    };

    const initialRegion = {
        latitude: farmLocation.lat,
        longitude: farmLocation.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <Card style={styles.card} elevation={3}>
            <Card.Content style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Icon name="store-marker" size={24} color="#059669" />
                        <Text style={styles.title}>{t('suggestions.nearbyMarkets') || 'Nearby Markets'}</Text>
                    </View>
                    <View style={styles.toggleContainer}>
                        <IconButton
                            icon="map"
                            selected={viewMode === 'map'}
                            onPress={() => setViewMode('map')}
                            size={20}
                            style={viewMode === 'map' ? styles.activeToggle : {}}
                        />
                        <IconButton
                            icon="format-list-bulleted"
                            selected={viewMode === 'list'}
                            onPress={() => setViewMode('list')}
                            size={20}
                            style={viewMode === 'list' ? styles.activeToggle : {}}
                        />
                    </View>
                </View>

                {viewMode === 'map' ? (
                    <View style={styles.mapContainer}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={initialRegion}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                        >
                            {/* Farm Marker */}
                            <Marker
                                coordinate={{ latitude: farmLocation.lat, longitude: farmLocation.lng }}
                                title="My Farm"
                                pinColor="green"
                            >
                                <View style={styles.farmMarker}>
                                    <Icon name="home-variant" size={20} color="#FFFFFF" />
                                </View>
                            </Marker>

                            {/* Market Markers */}
                            {markets.map(market => (
                                <Marker
                                    key={market.id}
                                    coordinate={{ latitude: Number(market.location_lat), longitude: Number(market.location_lng) }}
                                    title={market.name}
                                    description={`${market.distance_km} km away`}
                                    onCalloutPress={() => handleNavigate(market)}
                                >
                                    <View style={styles.marketMarker}>
                                        <Icon name="store" size={16} color="#FFFFFF" />
                                    </View>
                                    <Callout tooltip>
                                        <View style={styles.callout}>
                                            <Text style={styles.calloutTitle}>{market.name}</Text>
                                            <Text style={styles.calloutDetail}>{market.distance_km} km away</Text>
                                            <Button mode="contained" compact style={styles.navigateButton}>
                                                Navigate
                                            </Button>
                                        </View>
                                    </Callout>
                                </Marker>
                            ))}
                        </MapView>
                    </View>
                ) : (
                    <View>
                        {markets.map(market => (
                            <View key={market.id} style={styles.listItem}>
                                <View style={styles.listInfo}>
                                    <Text style={styles.marketName}>{market.name}</Text>
                                    <Text style={styles.marketDistance}>{market.distance_km} km away</Text>
                                    <View style={styles.daysRow}>
                                        {(market.market_days || []).map(day => (
                                            <Chip key={day} style={styles.dayChip} textStyle={{ fontSize: 10, color: '#374151' }}>{day.slice(0, 3)}</Chip>
                                        ))}
                                    </View>
                                </View>
                                <IconButton
                                    icon="navigation"
                                    mode="contained"
                                    containerColor="#059669"
                                    iconColor="#FFFFFF"
                                    size={20}
                                    onPress={() => handleNavigate(market)}
                                />
                            </View>
                        ))}
                    </View>
                )}
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    content: {
        padding: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    activeToggle: {
        backgroundColor: '#E5E7EB',
    },
    mapContainer: {
        height: 300,
        width: '100%',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    farmMarker: {
        backgroundColor: '#059669',
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    marketMarker: {
        backgroundColor: '#F59E0B',
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    callout: {
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 8,
        width: 150,
        alignItems: 'center',
    },
    calloutTitle: {
        fontWeight: '700',
        marginBottom: 4,
    },
    calloutDetail: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    navigateButton: {
        height: 30,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    listInfo: {
        flex: 1,
    },
    marketName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    marketDistance: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    daysRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 8,
    },
    dayChip: {
        // height: 24, // Removed to prevent text cutting
        backgroundColor: '#E5E7EB', // Darker background for better contrast
    },
});

export default MarketMapCard;
