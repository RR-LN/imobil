import { TextStyle } from 'react-native';
import { fontConfig } from '../constants/fonts';
import { colors } from './colors';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'mono' | 'monoBold' | 'button';

export function getTypography(variant: TextVariant, isDark: boolean = false): TextStyle {
  const textColor = isDark ? colors.text.primaryDark : colors.text.primary;
  const secondaryColor = isDark ? colors.text.secondaryDark : colors.text.secondary;
  const mutedColor = isDark ? colors.text.mutedDark : colors.text.muted;

  const variants: Record<TextVariant, TextStyle> = {
    h1: {
      fontFamily: fontConfig.playfair.regular,
      fontSize: 32,
      fontWeight: '400',
      color: textColor,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: fontConfig.playfair.regular,
      fontSize: 26,
      fontWeight: '400',
      color: textColor,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    h3: {
      fontFamily: fontConfig.playfair.bold,
      fontSize: 22,
      fontWeight: '700',
      color: textColor,
      lineHeight: 30,
    },
    h4: {
      fontFamily: fontConfig.inter.semibold,
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      lineHeight: 26,
    },
    body: {
      fontFamily: fontConfig.inter.regular,
      fontSize: 15,
      fontWeight: '400',
      color: secondaryColor,
      lineHeight: 24,
    },
    bodySmall: {
      fontFamily: fontConfig.inter.regular,
      fontSize: 13,
      fontWeight: '400',
      color: mutedColor,
      lineHeight: 20,
    },
    caption: {
      fontFamily: fontConfig.inter.medium,
      fontSize: 11,
      fontWeight: '500',
      color: mutedColor,
      lineHeight: 16,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    mono: {
      fontFamily: fontConfig.jetbrainsMono.regular,
      fontSize: 14,
      fontWeight: '400',
      color: secondaryColor,
      lineHeight: 22,
    },
    monoBold: {
      fontFamily: fontConfig.jetbrainsMono.bold,
      fontSize: 14,
      fontWeight: '700',
      color: textColor,
      lineHeight: 22,
    },
    button: {
      fontFamily: fontConfig.inter.semibold,
      fontSize: 15,
      fontWeight: '600',
      color: colors.background.light,
      lineHeight: 22,
      letterSpacing: 0.3,
    },
  };

  return variants[variant];
}
