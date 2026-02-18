import MMKVStorage from './storage';
import { api } from '../services/api';

export const TOKEN_KEY = 'token';

export async function getStoredToken() {
  try {
    return await MMKVStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null) {
  try {
    if (token) {
      await MMKVStorage.setItem(TOKEN_KEY, token);
    } else {
      await MMKVStorage.removeItem(TOKEN_KEY);
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