import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const TOKEN_KEY = 'token';

export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null) {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Handle error silently
  }
}

export async function loadPersistedAuth() {
  try {
    const token = await getStoredToken();
    if (token) {
      // Validate token by fetching profile
      const profile = await api.auth.profile(token);
      return {
        token,
        user: profile.user
      };
    }
  } catch {
    // Clear invalid token
    await setStoredToken(null);
  }
  return null;
}