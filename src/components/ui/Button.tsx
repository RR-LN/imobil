import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius, textStyles } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getVariantStyles = (variant: ButtonVariant, disabled: boolean) => {
  const baseButtonStyle: ViewStyle = {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (disabled) {
    return {
      button: {
        ...baseButtonStyle,
        backgroundColor: colors.lightMid,
        opacity: 0.5,
      },
      text: {
        color: colors.warmWhite,
      },
    };
  }

  switch (variant) {
    case 'primary':
      return {
        button: {
          ...baseButtonStyle,
          backgroundColor: colors.terra,
        },
        text: {
          color: colors.warmWhite,
        },
      };
    case 'secondary':
      return {
        button: {
          ...baseButtonStyle,
          backgroundColor: colors.warmWhite,
          borderWidth: 1,
          borderColor: colors.border,
        },
        text: {
          color: colors.charcoal,
        },
      };
    case 'ghost':
      return {
        button: {
          ...baseButtonStyle,
          backgroundColor: 'transparent',
        },
        text: {
          color: colors.terra,
        },
      };
  }
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const variantStyles = getVariantStyles(variant, disabled);

  return (
    <TouchableOpacity
      style={[styles.button, variantStyles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} />
      ) : (
        <Text style={[styles.text, variantStyles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
  },
  text: {
    ...textStyles.body,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
});

export default Button;
