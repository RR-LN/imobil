import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { getTypography } from './typography';

interface ThemeColors {
  primary: { deep: string; mid: string; light: string };
  accent: { gold: string; goldLight: string; goldDark: string };
  background: { light: string; dark: string; surface: string; surfaceDark: string };
  glass: { light: string; dark: string; borderLight: string; borderDark: string };
  text: { primary: string; primaryDark: string; secondary: string; secondaryDark: string; muted: string; mutedDark: string };
  status: { success: string; successBg: string; error: string; errorBg: string; warning: string; warningBg: string; info: string; infoBg: string };
  border: { light: string; dark: string };
  overlay: { light: string; dark: string };
}

interface ThemeSpacing {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

interface ThemeTypography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  caption: TextStyle;
  mono: TextStyle;
  monoBold: TextStyle;
  button: TextStyle;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  isDark: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function createTheme(isDark: boolean): Theme {
  return {
    colors: isDark
      ? {
          ...colors,
          background: {
            ...colors.background,
            light: colors.background.dark,
            dark: colors.background.dark,
            surface: colors.background.surfaceDark,
          },
          glass: {
            ...colors.glass,
            light: colors.glass.dark,
            dark: colors.glass.dark,
            borderLight: colors.glass.borderDark,
            borderDark: colors.glass.borderDark,
          },
          text: {
            ...colors.text,
            primary: colors.text.primaryDark,
            primaryDark: colors.text.primaryDark,
            secondary: colors.text.secondaryDark,
            secondaryDark: colors.text.secondaryDark,
            muted: colors.text.mutedDark,
            mutedDark: colors.text.mutedDark,
          },
        }
      : {
          ...colors,
          background: {
            ...colors.background,
            light: colors.background.light,
            dark: colors.background.light,
            surface: colors.background.surface,
          },
          glass: {
            ...colors.glass,
            light: colors.glass.light,
            dark: colors.glass.light,
            borderLight: colors.glass.borderLight,
            borderDark: colors.glass.borderLight,
          },
          text: {
            ...colors.text,
            primary: colors.text.primary,
            primaryDark: colors.text.primary,
            secondary: colors.text.secondary,
            secondaryDark: colors.text.secondary,
            muted: colors.text.muted,
            mutedDark: colors.text.muted,
          },
        },
    spacing,
    typography: {
      h1: getTypography('h1', isDark),
      h2: getTypography('h2', isDark),
      h3: getTypography('h3', isDark),
      h4: getTypography('h4', isDark),
      body: getTypography('body', isDark),
      bodySmall: getTypography('bodySmall', isDark),
      caption: getTypography('caption', isDark),
      mono: getTypography('mono', isDark),
      monoBold: getTypography('monoBold', isDark),
      button: getTypography('button', isDark),
    },
    isDark,
  };
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [isDark, setIsDark] = useState(false);

  const theme = useMemo(() => createTheme(isDark), [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context.theme;
}

export function useThemeToggle(): () => void {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeToggle must be used within ThemeProvider');
  }
  return context.toggleTheme;
}
