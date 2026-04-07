// Sage & Stone Theme - Nature-inspired luxury palette
export const colors = {
  primary: {
    deep: '#3D4A3D',      // Deep sage
    mid: '#5A6B5A',      // Primary sage
    light: '#7A8B7A',    // Light sage
  },
  accent: {
    gold: '#A67B5B',      // Warm terracotta stone
    goldLight: '#C49A7C', // Light stone
    goldDark: '#8B5A3C',  // Dark terracotta
  },
  background: {
    light: '#F7F5F3',    // Warm off-white
    dark: '#1A1A1A',     // Deep charcoal
    surface: '#FFFFFF',   // Pure white
    surfaceDark: '#2D2D2D',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(45, 45, 45, 0.85)',
    borderLight: 'rgba(90, 107, 90, 0.2)',
    borderDark: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    primary: '#2D3A2D',   // Rich forest
    primaryDark: '#F7F5F3', // Light cream
    secondary: '#5A6B5A', // Muted sage
    secondaryDark: '#9AA89A', // Light sage
    muted: '#8B988B',     // Soft green-gray
    mutedDark: '#6B7B6B', // Darker sage
  },
  status: {
    success: '#4A7C5C',
    successBg: 'rgba(74, 124, 92, 0.12)',
    error: '#B85C5C',
    errorBg: 'rgba(184, 92, 92, 0.12)',
    warning: '#B8962E',
    warningBg: 'rgba(184, 150, 46, 0.12)',
    info: '#5A7A9A',
    infoBg: 'rgba(90, 122, 154, 0.12)',
  },
  border: {
    light: '#E8E4E0',
    dark: '#3A3A3A',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.35)',
    dark: 'rgba(0, 0, 0, 0.6)',
  },
  // Extended palette for gradients and variations
  extended: {
    cream: '#FAF8F5',
    sand: '#E8E0D5',
    stone: '#C4B5A5',
    moss: '#6B8E6B',
    forest: '#2D3A2D',
    terracotta: '#A67B5B',
    terracottaLight: '#C49A7C',
  },
} as const;
