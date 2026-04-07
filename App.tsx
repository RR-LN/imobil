import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useLoadFonts } from './src/constants/fonts';
import { ThemeProvider } from './src/theme/theme';
import { AnimatedMeshGradient } from './src/components/ui/AnimatedMeshGradient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { notificationService } from './src/services/notificationService';
import { initializeReferralSystem } from './src/utils/referralHandler';
import { QueryProvider } from './src/providers/QueryProvider';
import { OfflineProvider } from './src/providers/OfflineProvider';
import { ToastProvider } from './src/components/Toast';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initI18n } from './src/i18n';

// Conditional Sentry import (web vs native)
let Sentry: any = null;
const isWeb = Platform.OS === 'web';

if (!isWeb) {
  try {
    Sentry = require('@sentry/react-native').default;
  } catch (e) {
    console.warn('Sentry not available:', e);
  }
} else {
  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    try {
      Sentry = require('@sentry/react').default;
    } catch (e) {
      console.warn('Sentry web not available:', e);
    }
  }
}

if (Sentry && process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: isWeb ? 0.2 : 1.0,
    debug: __DEV__,
  });
}

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <AnimatedMeshGradient />
      <View style={styles.splashContent}>
        <Text style={styles.splashLogo}>Kugava</Text>
        <Text style={styles.splashTagline}>Imobiliária de Luxo</Text>
      </View>
    </View>
  );
}

function ErrorScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashContent}>
        <Text style={styles.splashLogo}>Kugava</Text>
        <Text style={styles.splashError}>Erro ao carregar fontes</Text>
      </View>
    </View>
  );
}

const AppComponent = function App() {
  const { loaded, error } = useLoadFonts();
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    // Initialize i18n
    initI18n()
      .then(() => setI18nLoaded(true))
      .catch((err) => {
        console.error('Failed to initialize i18n:', err);
        setI18nLoaded(true); // Continue even if i18n fails
      });
  }, []);

  useEffect(() => {
    initializeReferralSystem().catch(console.error);

    const { remove } = notificationService.setupNotificationHandlers(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      },
      (response: any) => {
        console.log('Notification selected:', response);
        const { data } = response.notification.request.content;
      }
    );

    return () => {
      remove();
    };
  }, []);

  if (error) {
    return <ErrorScreen />;
  }

  if (!loaded || !i18nLoaded) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AnimatedMeshGradient />
        <ErrorBoundary>
          <QueryProvider>
            <SafeAreaProvider>
              <ToastProvider>
                <OfflineProvider>
                  <NavigationContainer>
                    <StatusBar style="dark" translucent />
                    <RootNavigator />
                  </NavigationContainer>
                </OfflineProvider>
              </ToastProvider>
            </SafeAreaProvider>
          </QueryProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default (Sentry?.wrap ? Sentry.wrap(AppComponent) : AppComponent);

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    gap: 8,
  },
  splashLogo: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 40,
    color: '#0F172A',
    letterSpacing: -1,
  },
  splashTagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  splashError: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#EF4444',
  },
});
