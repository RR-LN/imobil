import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const getPadding = (padding: CardProps['padding']) => {
  switch (padding) {
    case 'none':
      return 0;
    case 'sm':
      return spacing.sm;
    case 'md':
      return spacing.md;
    case 'lg':
      return spacing.lg;
    default:
      return spacing.md;
  }
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const variantStyles = {
    default: {
      backgroundColor: colors.warmWhite,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.warmWhite,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: colors.warmWhite,
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        { padding: getPadding(padding) },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});

export default Card;
