import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';

interface AnimatedMeshGradientProps {
  style?: ViewStyle;
}

interface CircleConfig {
  size: number;
  colors: [string, string];
  start: { x: number; y: number };
  duration: number;
}

const circleConfigs: CircleConfig[] = [
  {
    size: 300,
    colors: ['#D4AF37', '#B8962E'],
    start: { x: 0.2, y: 0.1 },
    duration: 8000,
  },
  {
    size: 250,
    colors: ['#0F172A', '#1E293B'],
    start: { x: 0.7, y: 0.6 },
    duration: 10000,
  },
  {
    size: 200,
    colors: ['#334155', '#475569'],
    start: { x: 0.5, y: 0.8 },
    duration: 12000,
  },
];

export function AnimatedMeshGradient({ style }: AnimatedMeshGradientProps) {
  

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }, style]}>
      {circleConfigs.map((config, index) => (
        <AnimatedCircle key={index} config={config} />
      ))}
    </View>
  );
}

function AnimatedCircle({ config }: { config: CircleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(40, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-40, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
        withTiming(30, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );

    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [config.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: 0.3 + progress.value * 0.2,
  }));

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          left: `${config.start.x * 100}%`,
          top: `${config.start.y * 100}%`,
        },
        animatedStyle,
      ]}
    >
      <AnimatedLinearGradient colors={config.colors} progress={progress} />
    </Animated.View>
  );
}

function AnimatedLinearGradient({
  colors,
  progress,
}: {
  colors: [string, string];
  progress: SharedValue<number>;
}) {
  const animatedGradientStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      colors,
    ),
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 9999 }, animatedGradientStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
