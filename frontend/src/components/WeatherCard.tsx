import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../services/weatherService';

interface WeatherCardProps {
    weather: WeatherData | null;
    placeName?: string;
    isLoading?: boolean;
    error?: string;
    onPress?: () => void;
}

export default function WeatherCard({ weather, placeName, isLoading, error, onPress }: WeatherCardProps) {
    if (isLoading) {
        return (
            <View style={styles.card}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons name="weather-cloudy-clock" size={40} color="#2D5016" />
                    <Text style={styles.loadingText}>Loading weather information...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.card, { backgroundColor: '#FEE2E2' }]}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons name="weather-cloudy-alert" size={40} color="#DC2626" />
                    <Text style={[styles.loadingText, { color: '#DC2626' }]}>{error}</Text>
                </View>
            </View>
        );
    }

    if (!weather) return null;
    const temp = Math.round(weather.temperature);
    const { icon, color, bg } = pickTheme(getWeatherCode(weather.condition), weather.windSpeed);

    const Card = onPress ? TouchableOpacity : View;

    return (
        <Card
            style={[styles.card, { backgroundColor: bg, borderColor: color }]}
            onPress={onPress}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={onPress ? "View weather details" : undefined}
        >
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color }]}>{extractTown(placeName) || 'Local Weather'}</Text>
            </View>
            <View style={styles.mainRow}>
                <View style={styles.left}>
                    <MaterialCommunityIcons name={icon} size={40} color={color} />
                    <Text style={[styles.temp, { color }]}>{temp}°C</Text>
                </View>
                <View style={styles.right}>
                    <Text
                        style={[styles.metaText, { color }]}
                    >
                        {weather.condition}
                    </Text>
                    {onPress && (
                        <Text style={[styles.tapHint, { color }]}>Tap for details</Text>
                    )}
                </View>
            </View>
        </Card>
    );
}

function truncate(s: string, n: number) { return s && s.length > n ? s.slice(0, n - 1) + '…' : s; }
function extractTown(display?: string) {
    if (!display) return undefined; const first = display.split(',')[0]; return truncate(first.trim(), 28);
}

function getWeatherCode(condition: string): number {
    const cond = (condition || '').toLowerCase();
    switch (cond) {
        case 'clear': return 0;
        case 'clouds': return 2;
        case 'rain': return 61;
        case 'snow': return 71;
        case 'thunderstorm': return 95;
        case 'fog': return 45;
        default: return 2;
    }
}

function pickTheme(code: number, wind: number): { icon: any; color: string; bg: string } {
    // Use green background similar to theme primary and secondary colors with lighter shades
    if (code === 0) return { icon: 'weather-sunny', color: '#F59E0B', bg: '#D1FAE5' }; // yellow sun, light green bg
    if ([1, 2].includes(code)) return { icon: 'weather-partly-cloudy', color: '#4A7C2C', bg: '#E6F2D9' }; // dark green clouds, lighter green bg
    if (code === 3) return { icon: 'weather-cloudy', color: '#4A7C2C', bg: '#E6F2D9' }; // dark green clouds, lighter green bg
    if ([45, 48].includes(code)) return { icon: 'weather-fog', color: '#4A7C2C', bg: '#E6F2D9' }; // dark green fog, lighter green bg
    if ([51, 53, 55, 56, 57, 61, 63, 65].includes(code)) return { icon: 'weather-rainy', color: '#4A7C2C', bg: '#D1FAE5' }; // dark green rain, light green bg
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: 'weather-snowy', color: '#4A7C2C', bg: '#E6F2D9' }; // dark green snow, lighter green bg
    if ([95, 96, 99].includes(code)) return { icon: 'weather-lightning', color: '#4A7C2C', bg: '#D1FAE5' }; // dark green lightning, light green bg
    return wind > 30 ? { icon: 'weather-windy', color: '#4A7C2C', bg: '#E6F2D9' } : { icon: 'weather-partly-cloudy', color: '#4A7C2C', bg: '#D1FAE5' };
}

function shortSummary(code: number): string {
    if (code === 0) return 'Clear sky';
    if ([1, 2].includes(code)) return 'Partly cloudy';
    if (code === 3) return 'Cloudy';
    if ([51, 53, 55, 56, 57, 61, 63, 65].includes(code)) return 'Rain expected';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow showers';
    if ([95, 96, 99].includes(code)) return 'Thunderstorms';
    return 'Weather update';
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        marginBottom: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#2D5016',
        textAlign: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    right: {
        alignItems: 'flex-end',
        maxWidth: '60%',
        flexShrink: 1,
    },
    temp: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 1,
    },
    metaText: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 4,
        textAlign: 'right',
        flexShrink: 1,
        includeFontPadding: false,
        flexWrap: 'wrap',
        width: '100%'
    },
    tapHint: {
        fontSize: 14,
        opacity: 0.8,
    },
});


