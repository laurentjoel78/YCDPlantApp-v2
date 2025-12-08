import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import fr from './locales/fr.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

// Get stored language preference
const getStoredLanguage = async () => {
  try {
    const lang = await AsyncStorage.getItem('appLanguage');
    return lang || 'fr'; // Default to French
  } catch {
    return 'fr';
  }
};

const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });

// Initialize with stored language
getStoredLanguage().then((lang: string) => {
  i18n.changeLanguage(lang);
});

export const changeLanguage = async (lng: 'fr' | 'en'): Promise<void> => {
  await AsyncStorage.setItem('appLanguage', lng);
  await i18n.changeLanguage(lng);
};

export default i18n;