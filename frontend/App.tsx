import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/utils/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NavigationContainer } from './src/navigation/NavigationContainer';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/store/AppContext';
import { LanguageProvider } from './src/context/LanguageContext';
import './src/i18n';
import installGlobalErrorHandler from './src/utils/globalErrorHandler';

// Install global handler early
installGlobalErrorHandler();

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <LanguageProvider>
          <PaperProvider theme={theme}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </PaperProvider>
        </LanguageProvider>
      </AppProvider>
    </AuthProvider>
  );
}