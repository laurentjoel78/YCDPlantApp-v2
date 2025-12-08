import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

const SettingsScreen: React.FC = () => {
  const { currentLanguage, setAppLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <View style={styles.row}>
        <RadioButton
          value="fr"
          status={currentLanguage === 'fr' ? 'checked' : 'unchecked'}
          onPress={() => setAppLanguage('fr')}
        />
        <Text style={styles.label}>{t('settings.language.french')}</Text>
      </View>
      <View style={styles.row}>
        <RadioButton
          value="en"
          status={currentLanguage === 'en' ? 'checked' : 'unchecked'}
          onPress={() => setAppLanguage('en')}
        />
        <Text style={styles.label}>{t('settings.language.english')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
  },
});

export default SettingsScreen;
