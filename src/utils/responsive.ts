import { Platform, Dimensions } from 'react-native';

/**
 * Responsive utility for web and mobile
 * Provides breakpoints and scaling helpers
 */

// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints (in dp, similar to CSS)
export const BREAKPOINTS = {
  xs: 0,      // phones
  sm: 576,    // large phones / small tablets
  md: 768,    // tablets
  lg: 992,    // small desktops
  xl: 1200,   // desktops
  xxl: 1600,  // large desktops
};

// Current breakpoint based on width
export const getCurrentBreakpoint = () => {
  const width = SCREEN_WIDTH;
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Check if web
export const isWeb = Platform.OS === 'web';

// Check if desktop (web with width > md)
export const isDesktop = isWeb && SCREEN_WIDTH >= BREAKPOINTS.md;

// Responsive value helper
export const responsive = (values: {
  xs?: any;
  sm?: any;
  md?: any;
  lg?: any;
  xl?: any;
  xxl?: any;
  default?: any;
}) => {
  const bp = getCurrentBreakpoint();
  // Return value for current breakpoint or fallback
  return values[bp] ?? values.default ?? values.xs ?? values.sm ?? values.md ?? values.lg ?? values.xl ?? values.xxl;
};

// Scale font size based on screen width
export const scaleFont = (size: number) => {
  if (!isWeb) return size; // mobile uses fixed sizes
  const scale = SCREEN_WIDTH / 375; // base width iPhone SE
  return Math.round(size * Math.min(scale, 1.5)); // cap at 1.5x
};

// Scale spacing/margin/padding
export const scaleSpacing = (size: number) => {
  if (!isWeb) return size;
  const scale = SCREEN_WIDTH / 375;
  return Math.round(size * Math.min(scale, 1.3));
};

// Get number of columns for grid based on screen width
export const getGridColumns = (minColumnWidth: number = 300) => {
  if (!isWeb) return 1;
  const maxColumns = Math.floor(SCREEN_WIDTH / minColumnWidth);
  return Math.max(1, Math.min(maxColumns, 5)); // between 1 and 5 columns
};

// Get max width for container (centered on desktop)
export const getContainerMaxWidth = () => {
  if (!isWeb) return '100%';
  return responsive({
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    xxl: '1320px',
    default: '1200px',
  });
};

// Get card width for property cards
export const getCardWidth = (withGap: boolean = true) => {
  if (!isWeb) return '100%';

  const gap = withGap ? 16 : 0;
  const containerWidth = Math.min(SCREEN_WIDTH - 32, 1400); // with padding

  const columns = getGridColumns(280);
  const cardWidth = (containerWidth - (gap * (columns - 1))) / columns;

  return `${cardWidth}px`;
};

export const getCardWidthPercent = () => {
  if (!isWeb) return '100%';
  const columns = getGridColumns(280);
  return `${100 / columns}%`;
};

// Check if should show sidebar (desktop only)
export const shouldShowSidebar = () => {
  return isWeb && SCREEN_WIDTH >= BREAKPOINTS.lg;
};

// Export for use in components
export default {
  isWeb,
  isDesktop,
  getCurrentBreakpoint,
  responsive,
  scaleFont,
  scaleSpacing,
  getGridColumns,
  getContainerMaxWidth,
  getCardWidth,
  getCardWidthPercent,
  shouldShowSidebar,
  BREAKPOINTS,
};
