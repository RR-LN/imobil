import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(width: number): DeviceType {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function getPropertyColumns(type: DeviceType): number {
  switch (type) {
    case 'desktop':
      return 4;
    case 'tablet':
      return 3;
    default:
      return 2;
  }
}

export function useResponsiveLayout() {
  const [dimensions, setDimensions] = useState<ScaledSize>(() => Dimensions.get('window'));

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
          scale: 1,
          fontScale: 1,
        });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const deviceType = getDeviceType(dimensions.width);
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';

  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    width: dimensions.width,
    height: dimensions.height,
    columns: getPropertyColumns(deviceType),
  };
}
