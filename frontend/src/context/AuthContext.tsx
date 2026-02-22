import React, { createContext, useState, useEffect } from 'react';
import { CacheManager, CACHE_KEYS } from '../services/cacheManager';
import { api } from '../services/api';
import MMKVStorage from '../utils/storage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  approval_status?: string;
  email_verified?: boolean;
  profile_image_url?: string;
  farms?: Array<{
    id: string;
    name: string;
    location_lat: number;
    location_lng: number;
  }>;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', accessToken: string, userData: { email: string; name: string; picture?: string; providerId: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      // Check cache version first (auto-clears on schema changes)
      await CacheManager.checkVersion();

      // Try to get cached token and user
      const cachedToken = await CacheManager.get<string>(CACHE_KEYS.TOKEN);
      const cachedUser = await CacheManager.get<User>(CACHE_KEYS.USER);

      if (cachedToken && cachedUser) {
        console.log('[Auth] Using cached user data');
        setToken(cachedToken);
        setUser(cachedUser);
        setIsLoading(false);
        return;
      }

      // If no cache, try legacy MMKV storage (for migration)
      const legacyToken = await MMKVStorage.getItem('token') || await MMKVStorage.getItem('authToken');

      if (legacyToken) {
        console.log('[Auth] Migrating from legacy storage');
        // Load fresh data and cache it properly
        const [profile, farmsData] = await Promise.all([
          api.auth.profile(legacyToken),
          api.farms.getUserFarms(legacyToken)
        ]);

        const userWithFarms = { ...profile.user, farms: farmsData.farms };

        // Store in new cache system with 24h TTL
        await CacheManager.set(CACHE_KEYS.TOKEN, legacyToken, 24 * 60 * 60 * 1000);
        await CacheManager.set(CACHE_KEYS.USER, userWithFarms, 24 * 60 * 60 * 1000);

        setToken(legacyToken);
        setUser(userWithFarms);
      }
    } catch (error) {
      console.error('[Auth] Failed to load auth data:', error);
      await CacheManager.invalidate([CACHE_KEYS.TOKEN, CACHE_KEYS.USER]);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[Auth] Logging in...');
      const response = await api.auth.login(email, password);
      const farmsData = await api.farms.getUserFarms(response.token);

      const userWithFarms = { ...response.user, farms: farmsData.farms };

      // Store with 24h TTL (auto-expires after 1 day)
      await CacheManager.set(CACHE_KEYS.TOKEN, response.token, 24 * 60 * 60 * 1000);
      await CacheManager.set(CACHE_KEYS.USER, userWithFarms, 24 * 60 * 60 * 1000);

      // ALSO save token to MMKV for API service
      await MMKVStorage.setItem('token', response.token);
      await MMKVStorage.setItem('user', JSON.stringify(userWithFarms));

      setToken(response.token);
      setUser(userWithFarms);
      console.log('[Auth] Login successful, user cached');
      console.log('[Auth] Token saved to MMKV');
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('[Auth] Logging out, clearing cache');
    setToken(null);
    setUser(null);
    // Clear all auth-related cache
    await CacheManager.invalidate([CACHE_KEYS.TOKEN, CACHE_KEYS.USER, CACHE_KEYS.FARMS]);
    // Also clear MMKV
    await MMKVStorage.multiRemove(['token', 'user']);
  };

  const socialLogin = async (
    provider: 'google' | 'facebook',
    accessToken: string,
    userData: { email: string; name: string; picture?: string; providerId: string }
  ) => {
    try {
      console.log(`[Auth] Social login with ${provider}...`);
      const response = await api.auth.socialLogin(provider, accessToken, userData);
      const farmsData = await api.farms.getUserFarms(response.token);

      const userWithFarms = { ...response.user, farms: farmsData.farms };

      // Store with 24h TTL (auto-expires after 1 day)
      await CacheManager.set(CACHE_KEYS.TOKEN, response.token, 24 * 60 * 60 * 1000);
      await CacheManager.set(CACHE_KEYS.USER, userWithFarms, 24 * 60 * 60 * 1000);

      // ALSO save token to MMKV for API service
      await MMKVStorage.setItem('token', response.token);
      await MMKVStorage.setItem('user', JSON.stringify(userWithFarms));

      setToken(response.token);
      setUser(userWithFarms);
      console.log(`[Auth] ${provider} login successful, user cached`);
    } catch (error) {
      console.error(`[Auth] ${provider} login error:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, socialLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}