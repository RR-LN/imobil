import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, textStyles } from '../../constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'pro';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const getVariantStyles = (variant: BadgeVariant) => {
  switch (variant) {
    case 'success':
      return {
        container: {
          backgroundColor: 'rgba(45, 80, 22, 0.1)',
          borderColor: colors.forestLight,
        },
        text: {
          color: colors.forest,
        },
      };
    case 'warning':
      return {
        container: {
          backgroundColor: 'rgba(212, 148, 58, 0.1)',
          borderColor: colors.ochre,
        },
        text: {
          color: colors.ochre,
        },
      };
    case 'pro':
      return {
        container: {
          backgroundColor: 'rgba(45, 80, 22, 0.1)',
          borderColor: colors.forest,
        },
        text: {
          color: colors.forest,
        },
      };
    default:
      return {
        container: {
          backgroundColor: 'rgba(196, 98, 45, 0.1)',
          borderColor: colors.terra,
        },
        text: {
          color: colors.terra,
        },
      };
  }
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <View style={[styles.badge, variantStyles.container, style]}>
      <Text style={[styles.text, variantStyles.text]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...textStyles.small,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default Badge;
