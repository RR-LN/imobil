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

// Sage & Stone palette - nature-inspired organic gradients
const circleConfigs: CircleConfig[] = [
  { size: 320, colors: ['#A67B5B', '#C49A7C'], start: { x: 0.15, y: 0.1 }, duration: 10000 },
  { size: 280, colors: ['#5A6B5A', '#7A8B7A'], start: { x: 0.75, y: 0.55 }, duration: 13000 },
  { size: 220, colors: ['#C4B5A5', '#E8E0D5'], start: { x: 0.45, y: 0.85 }, duration: 15000 },
  { size: 180, colors: ['#6B8E6B', '#8BAE8B'], start: { x: 0.2, y: 0.7 }, duration: 9000 },
];

export function AnimatedMeshGradient({ style }: AnimatedMeshGradientProps) {
  return (
    <View style={[styles.container, { backgroundColor: '#F7F5F3' }, style]}>
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
        withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
        withTiming(30, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [config.duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
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
    backgroundColor: interpolateColor(progress.value, [0, 1], colors),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { borderRadius: 9999 }, animatedGradientStyle]}
    />
  );
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
