import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/theme';

type SkeletonVariant = 'text' | 'circle' | 'rect';

interface SkeletonProps {
  width?: number;
  height?: number;
  radius?: number;
  variant?: SkeletonVariant;
  fullWidth?: boolean;
}

export function Skeleton({
  width,
  height = 16,
  radius,
  variant = 'rect',
  fullWidth = false,
}: SkeletonProps) {
  const theme = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = 0.3 + shimmer.value * 0.4;
    return {
      opacity,
    };
  });

  const resolvedRadius =
    radius ?? (variant === 'circle' ? 9999 : variant === 'text' ? 4 : 8);

  const resolvedWidth = variant === 'circle' ? height : width;

  return (
    <Animated.View
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        {
          width: resolvedWidth,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
});
