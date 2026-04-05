// Imobil Design System
// Premium real estate experience - warm earth tones inspired by Mozambique's landscape

export const colors = {
  // Primary Brand - Terra
  terra: '#C4622D',
  terraLight: '#E8835A',
  terraDark: '#9B4B1F',
  terraMuted: 'rgba(196, 98, 45, 0.08)',

  // Accent - Ochre/Gold
  ochre: '#D4943A',
  ochreLight: '#F0B860',

  // Forest - Success/CTA secondary
  forest: '#2D5016',
  forestMid: '#3D6B20',
  forestLight: '#5A8C35',

  // Premium Neutrals
  cream: '#FAF6EF',
  warmWhite: '#FDF9F4',
  offWhite: '#F8F4ED',
  paper: '#FFFFFF',

  // Text colors
  charcoal: '#1A1512',
  charcoalLight: '#3D3630',
  mid: '#6B5E52',
  lightMid: '#A89880',
  muted: '#C4B8A8',

  // Borders & Dividers
  border: 'rgba(196, 98, 45, 0.12)',
  borderLight: 'rgba(107, 94, 82, 0.08)',
  divider: 'rgba(107, 94, 82, 0.1)',

  // Semantic aliases for backwards compatibility
  primary: '#C4622D',
  dark: '#1A1512',
  white: '#FFFFFF',
  black: '#000000',
  error: '#B85450',
  errorLight: 'rgba(184, 84, 80, 0.1)',
  success: '#2D5016',
  warning: '#D4943A',
  info: '#4A5568',
};

export const typography = {
  // Font families - Premium pairing
  fontDisplay: 'PlayfairDisplay_400Regular',
  fontDisplaySemiBold: 'PlayfairDisplay_600SemiBold',
  fontDisplayItalic: 'PlayfairDisplay_400Regular_Italic',
  fontBody: 'DMSans_400Regular',
  fontBodyMedium: 'DMSans_500Medium',
  fontBodyBold: 'DMSans_700Bold',

  // Font sizes - Harmonized scale
  sizes: {
    xxs: 8,      // micro - backward compat
    micro: 10,
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
    hero: 40,
  },
  // Aliases for backward compatibility
  caption: 'DMSans_400Regular',

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // Keep for backwards compatibility
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  // Backward compatibility
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Alias for backward compatibility
  small: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  xs: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
  // Inner shadow effect using inset (iOS)
  inner: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
};

// Animation durations
export const transitions = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Reusable text styles
export const textStyles = {
  display: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.display,
    fontWeight: '400' as const,
    color: colors.charcoal,
    lineHeight: typography.lineHeights.tight * typography.sizes.display,
    letterSpacing: typography.letterSpacing.tight,
  },
  hero: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.hero,
    fontWeight: '400' as const,
    color: colors.charcoal,
    lineHeight: typography.lineHeights.tight * typography.sizes.hero,
  },
  h1: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.xxl,
    fontWeight: '400' as const,
    color: colors.charcoal,
    lineHeight: typography.lineHeights.tight * typography.sizes.xxl,
  },
  h2: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.xl,
    fontWeight: '400' as const,
    color: colors.charcoal,
    lineHeight: typography.lineHeights.tight * typography.sizes.xl,
  },
  h3: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.lg,
    fontWeight: '500' as const,
    color: colors.charcoal,
    lineHeight: typography.lineHeights.normal * typography.sizes.lg,
  },
  body: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.md,
    fontWeight: '400' as const,
    color: colors.charcoalLight,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.md,
  },
  bodySmall: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    fontWeight: '400' as const,
    color: colors.mid,
    lineHeight: typography.lineHeights.normal * typography.sizes.sm,
  },
  label: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    fontWeight: '500' as const,
    color: colors.mid,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.sizes.md,
    fontWeight: '500' as const,
    letterSpacing: typography.letterSpacing.wide,
  },
  caption: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    fontWeight: '400' as const,
    color: colors.lightMid,
  },
  price: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.lg,
    fontWeight: '400' as const,
    color: colors.terra,
  },
  // Backward compatibility aliases
  title: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.xl,
    fontWeight: '400' as const,
    color: colors.charcoal,
    lineHeight: typography.lineHeights.tight * typography.sizes.xl,
  },
  heading: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xl,
    fontWeight: '600' as const,
    color: colors.charcoal,
  },
  small: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    fontWeight: '400' as const,
    color: colors.lightMid,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  textStyles,
};
