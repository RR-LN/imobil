import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, textStyles } from '../constants/theme';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Full-screen loading state for initial app load or auth check
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'A carregar...' 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Imobil</Text>
      </View>
      <ActivityIndicator size="large" color={colors.terra} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

/**
 * Inline loading for lists and content areas
 */
export const LoadingInline: React.FC<LoadingScreenProps> = ({ 
  message 
}) => {
  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={colors.terra} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

/**
 * Loading placeholder for cards and list items
 */
export const LoadingPlaceholder: React.FC<{ 
  height?: number; 
  borderRadius?: number;
}> = ({ 
  height = 100, 
  borderRadius = 12 
}) => {
  return (
    <View 
      style={[
        styles.placeholder, 
        { height, borderRadius }
      ]} 
    />
  );
};

/**
 * Skeleton loader for property cards
 */
export const LoadingPropertyCard: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardPrice} />
        <View style={styles.cardLocation} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Full screen loading
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    fontFamily: 'Georgia',
    fontSize: 36,
    fontWeight: '400',
    color: colors.charcoal,
    letterSpacing: -1,
  },
  logoAccent: {
    color: colors.terra,
    fontWeight: '600',
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    ...textStyles.caption,
    color: colors.mid,
  },

  // Inline loading
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  inlineMessage: {
    ...textStyles.caption,
    marginLeft: spacing.sm,
    color: colors.mid,
  },

  // Placeholder
  placeholder: {
    backgroundColor: colors.border,
    width: '100%',
  },

  // Property card skeleton
  cardContainer: {
    backgroundColor: colors.warmWhite,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImage: {
    height: 120,
    backgroundColor: colors.border,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardPrice: {
    height: 16,
    width: '40%',
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  cardLocation: {
    height: 12,
    width: '60%',
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});

export default LoadingScreen;
