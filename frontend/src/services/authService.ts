import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { STORAGE_KEYS } from '../config/constants';

export const authService = {
  async login(email: string, password: string) {
    try {
      // Use centralized API wrapper which handles base URL and parsing
      const response = await api.auth.login(email, password);

      // api.auth.login returns { token, user }
      if (response && response.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      // Call the backend logout endpoint via api wrapper (keeps base URL logic in one place)
      if (token) {
        try {
          await api.auth.logout(token);
        } catch (err) {
          // Log and continue to ensure local cleanup
          console.warn('Logout request failed, clearing locally:', err);
        }
      }

      // Clear local storage
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    } catch (error) {
      // Even if the server request fails, we still want to clear local storage
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async getProfile() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return null;
      const response = await api.auth.profile(token);
      return response.user;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }
};