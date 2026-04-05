import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOffline } from '../providers/OfflineProvider';
import { colors, spacing, textStyles } from '../constants/theme';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.dot} />
        <Text style={styles.text}>Sem conexão à internet</Text>
      </View>
      <Text style={styles.subtext}>A mostrar dados em cache</Text>
    </View>
  );
};

interface OfflineButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
}

export const OfflineAwareButton: React.FC<OfflineButtonProps> = ({
  onPress,
  title,
  disabled,
  loading,
}) => {
  const { isOffline, checkConnection } = useOffline();

  const handlePress = async () => {
    const isOnline = await checkConnection();
    if (isOnline) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || isOffline) && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Text style={styles.buttonText}>
        {isOffline ? 'Offline' : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.forest,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: spacing.sm,
  },
  text: {
    ...textStyles.body,
    color: colors.warmWhite,
    fontWeight: '600',
  },
  subtext: {
    ...textStyles.caption,
    color: colors.cream,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.terra,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    ...textStyles.body,
    color: colors.warmWhite,
    fontWeight: '600',
  },
});
