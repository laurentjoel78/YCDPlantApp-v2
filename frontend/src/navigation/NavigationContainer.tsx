import React, { useCallback, createContext, useContext } from 'react';
import {
  NavigationContainer as RNNavigationContainer,
  createNavigationContainerRef,
  NavigationState,
  CommonActions,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './types';

// Create a global navigation ref that can be imported anywhere
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Create a navigation context for component-based access
const NavigationContext = createContext<{
  isReady: boolean;
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
}>({
  isReady: false,
  navigate: () => {
    console.warn('[Navigation] Navigation context not initialized');
  },
  goBack: () => {
    console.warn('[Navigation] Navigation context not initialized');
  },
});

// Hook for accessing navigation within components
export const useNavigation = () => useContext(NavigationContext);

// Global navigation functions with safety checks and logging
export const navigation = {
  goBack: () => {
    try {
      if (!navigationRef.current || !navigationRef.current.isReady()) {
        console.warn('[Navigation] Navigation is not initialized or not ready');
        return false;
      }
      const canGoBack = navigationRef.current.canGoBack();
      if (!canGoBack) {
        console.warn('[Navigation] Cannot go back from this screen');
        return false;
      }
      navigationRef.current.goBack();
      return true;
    } catch (error) {
      console.error('[Navigation] Error during goBack:', error);
      return false;
    }
  },
  navigate: (screen: keyof RootStackParamList, params?: any) => {
    try {
      if (!navigationRef.current) {
        console.warn('[Navigation] Navigation reference is not initialized');
        return;
      }
      if (!navigationRef.isReady()) {
        console.warn('[Navigation] Navigation is not ready');
        return;
      }
      navigationRef.dispatch(
        CommonActions.navigate({
          name: screen,
          params,
        })
      );
    } catch (error) {
      console.error('[Navigation] Error during navigate:', error);
    }
  },
  getCurrentRoute: () => {
    try {
      if (!navigationRef.current || !navigationRef.isReady()) {
        return null;
      }
      return navigationRef.getCurrentRoute();
    } catch (error) {
      console.error('[Navigation] Error getting current route:', error);
      return null;
    }
  }
};

type NavigationContainerProps = {
  children: React.ReactNode;
};

export function NavigationContainer({ children }: NavigationContainerProps) {
  const [isReady, setIsReady] = React.useState(false);

  const navigate = useCallback((name: keyof RootStackParamList, params?: any) => {
    if (navigationRef.current?.isReady()) {
      navigationRef.current?.dispatch(
        CommonActions.navigate({
          name,
          params,
        })
      );
    } else {
      console.warn('[Navigation] Navigation attempted before navigation is ready');
    }
  }, []);

  const goBack = useCallback(() => {
    if (!navigationRef.current || !navigationRef.current.isReady()) {
      console.warn('[Navigation] Navigation is not initialized or not ready');
      return;
    }
    const canGoBack = navigationRef.current.canGoBack();
    if (!canGoBack) {
      console.warn('[Navigation] Cannot go back from this screen');
      return;
    }
    navigationRef.current.goBack();
  }, []);

  const onStateChange = useCallback((state: NavigationState | undefined) => {
    if (state) {
      console.debug('[Navigation] State changed:', {
        index: state.index,
        routes: state.routes.map(route => ({
          name: route.name,
          key: route.key,
          params: route.params || null
        }))
      });
    }
  }, []);

  const value = React.useMemo(() => ({
    isReady,
    navigate,
    goBack
  }), [isReady, navigate, goBack]);

  return (
    <SafeAreaProvider>
      <NavigationContext.Provider value={value}>
        <RNNavigationContainer
          ref={navigationRef}
          onStateChange={onStateChange}
          onUnhandledAction={(action) => {
            console.warn('[Navigation] Unhandled action:', action);
          }}
          onReady={() => {
            setIsReady(true);
            console.debug('[Navigation] Ready');
          }}
        >
          {children}
        </RNNavigationContainer>
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}