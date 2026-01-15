// Storage Service - Local storage operations
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER: '@user',
  PREFERENCES: '@preferences',
  ONBOARDING_COMPLETE: '@onboarding_complete',
};

export const storageService = {
  // Auth tokens
  setAuthToken: async (token) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  getAuthToken: async () => {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setRefreshToken: async (token) => {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getRefreshToken: async () => {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // User data
  setUser: async (user) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: async () => {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  // Preferences
  setPreferences: async (preferences) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  },

  getPreferences: async () => {
    const prefs = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return prefs ? JSON.parse(prefs) : {};
  },

  // Onboarding
  setOnboardingComplete: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },

  isOnboardingComplete: async () => {
    return (await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)) === 'true';
  },

  // Clear all
  clearAll: async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },
};

