import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { useAuthStore } from '../store/authStore';
import { OnboardingScreen, hasSeenOnboarding } from '../features/onboarding/OnboardingScreen';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { colors, textStyles } from '../constants/theme';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const SplashScreen = () => (
  <View style={styles.splashContainer}>
    <Text style={styles.logo}>Kugava</Text>
    <ActivityIndicator size="large" color={colors.terra} style={styles.loader} />
  </View>
);

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, loadSession } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    loadSession();
    hasSeenOnboarding().then((seen) => setShowOnboarding(!seen));
  }, [loadSession]);

  if (isLoading || showOnboarding === null) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated && showOnboarding && (
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen
              {...props}
              onComplete={() => setShowOnboarding(false)}
            />
          )}
        </Stack.Screen>
      )}
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Admin" component={AdminDashboard} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 40,
    color: colors.charcoal,
    letterSpacing: -1,
  },
  loader: {
    marginTop: 24,
  },
});

export default RootNavigator;
