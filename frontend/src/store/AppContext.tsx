import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppUser = { 
  id: string;
    farms?: { id: string; name?: string }[];
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  role?: string;
  email?: string;
  region?: string;
  approvalStatus?: string;
  emailVerified?: boolean;
} | null;

interface WeatherData {
    current_weather?: {
        temperature: number;
        weathercode: number;
        windspeed: number;
        winddirection: number;
    };
    hourly?: {
        temperature_2m: number[];
        precipitation: number[];
        relative_humidity_2m: number[];
        time: string[];
    };
}

type AppState = {
    user: AppUser;
    setUser: (u: AppUser) => void;
    logout: () => Promise<void>;
    weather: WeatherData | null;
    refreshWeather: (location: string | { lat: number; lon: number }) => Promise<void>;
    offline: { isOffline: boolean; pendingSync: number };
    setOffline: (o: { isOffline: boolean; pendingSync: number }) => void;
    placeName?: string;
};

const Ctx = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser>(null);
    const [weather, setWeather] = useState<any>(null);
    const [offline, setOffline] = useState({ isOffline: false, pendingSync: 0 });
    const [placeName, setPlaceName] = useState<string | undefined>();
    
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    };

    async function refreshWeather(locationOrCoords: string | { lat: number; lon: number }) {
        try {
            if (typeof locationOrCoords === 'string') {
                const data = await api.weather.byLocation(locationOrCoords);
                setWeather(data);
            } else {
                const data = await api.weather.byCoords(locationOrCoords.lat, locationOrCoords.lon);
                setWeather(data);
                try {
                    const rev = await api.weather.reverseGeocode(locationOrCoords.lat, locationOrCoords.lon);
                    setPlaceName(rev?.display_name);
                } catch { }
            }
        } catch {
            // ignore for mock stage
        }
    }

    useEffect(() => {
        (async () => {
            try {
                // Try to load token and profile
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    try {
                        const profile = await api.auth.profile(token);
                        // profile.user already contains id; avoid duplicating id via spread
                        setUser(profile.user as any);
                    } catch (e) {
                        // invalid token / profile fetch failed, clear
                        await AsyncStorage.removeItem('token');
                    }
                }

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;
                const loc = await Location.getCurrentPositionAsync({});
                refreshWeather({ lat: loc.coords.latitude, lon: loc.coords.longitude });
                // Auto-refresh every 10 minutes
                const id = setInterval(() => {
                    refreshWeather({ lat: loc.coords.latitude, lon: loc.coords.longitude });
                }, 10 * 60 * 1000);
                return () => clearInterval(id);
            } catch {
                // ignore
            }
        })();
    }, []);

    return (
        <Ctx.Provider value={{ user, setUser, logout, weather, refreshWeather, offline, setOffline, placeName }}>
            {children}
        </Ctx.Provider>
    );
}

export function useApp() {
    const v = useContext(Ctx);
    if (!v) throw new Error('useApp must be used within AppProvider');
    return v;
}

