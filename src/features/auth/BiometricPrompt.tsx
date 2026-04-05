import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useBiometricAuth, BiometricType } from './useBiometricAuth';

interface BiometricPromptProps {
  onSuccess: () => void;
  onFallback: () => void;
}

export function BiometricPrompt({ onSuccess, onFallback }: BiometricPromptProps) {
  const { t } = useTranslation();
  const {
    isSupported,
    biometricType,
    isEnrolled,
    isEnabled,
    isAuthenticating,
    checkBiometricSupport,
    authenticate,
  } = useBiometricAuth();

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  const handleAuthenticate = async () => {
    const success = await authenticate();
    if (success) {
      onSuccess();
    }
  };

  if (!isSupported || !isEnrolled) {
    return null;
  }

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (biometricType) {
      case 'face':
        return 'scan';
      case 'fingerprint':
        return 'finger-print';
      case 'iris':
        return 'eye';
      default:
        return 'shield-checkmark';
    }
  };

  const getLabel = (): string => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID';
      default:
        return t('auth.biometricLogin');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleAuthenticate}
        disabled={isAuthenticating}
        activeOpacity={0.7}
      >
        {isAuthenticating ? (
          <ActivityIndicator color="#D4AF37" />
        ) : (
          <>
            <Ionicons name={getIcon()} size={32} color="#D4AF37" />
            <Text style={styles.label}>{getLabel()}</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.fallback} onPress={onFallback}>
        <Text style={styles.fallbackText}>{t('auth.password')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    minWidth: 200,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#D4AF37',
  },
  fallback: {
    paddingVertical: 8,
  },
  fallbackText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});
