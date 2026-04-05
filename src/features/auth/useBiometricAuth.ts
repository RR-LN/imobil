import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'kugava-biometric-enabled';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

interface BiometricState {
  isSupported: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
  isEnabled: boolean;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({
    isSupported: false,
    biometricType: 'none',
    isEnrolled: false,
    isEnabled: false,
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const checkBiometricSupport = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricType = 'none';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      const savedEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

      setState({
        isSupported: compatible,
        biometricType,
        isEnrolled: enrolled,
        isEnabled: savedEnabled === 'true',
      });
    } catch (error) {
      console.error('Biometric check error:', error);
      setState({
        isSupported: false,
        biometricType: 'none',
        isEnrolled: false,
        isEnabled: false,
      });
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.isEnrolled) {
      return false;
    }

    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar com Kugava',
        fallbackLabel: 'Usar palavra-passe',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric auth error:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [state.isSupported, state.isEnrolled]);

  const enableBiometric = useCallback(async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setState((prev) => ({ ...prev, isEnabled: true }));
      return true;
    } catch (error) {
      console.error('Enable biometric error:', error);
      return false;
    }
  }, []);

  const disableBiometric = useCallback(async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      setState((prev) => ({ ...prev, isEnabled: false }));
      return true;
    } catch (error) {
      console.error('Disable biometric error:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    isAuthenticating,
    checkBiometricSupport,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
}
