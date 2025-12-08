import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../i18n';

interface LanguageContextType {
  currentLanguage: string;
  setAppLanguage: (lang: 'fr' | 'en') => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'fr',
  setAppLanguage: async () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('fr');

  useEffect(() => {
    // Load stored language preference
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        if (storedLang) {
          setCurrentLanguage(storedLang);
        }
      } catch {
        // Ignore error
      }
    };
    loadLanguage();
  }, []);

  const setAppLanguage = async (lang: 'fr' | 'en') => {
    try {
      await changeLanguage(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setAppLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};