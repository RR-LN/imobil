import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ParticleFeedbackProps {
  visible: boolean;
  originX?: number;
  originY?: number;
  color?: string;
  count?: number;
  onComplete?: () => void;
}

const COLORS = ['#D4AF37', '#E8CC6E', '#F8FAFC', '#22C55E', '#3B82F6'];

export function ParticleFeedback({
  visible,
  originX = 0,
  originY = 0,
  color,
  count = 12,
  onComplete,
}: ParticleFeedbackProps) {
  const particles = useRef<Particle[]>([]);

  if (visible && particles.current.length === 0) {
    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      color: color || COLORS[i % COLORS.length],
      size: 4 + Math.random() * 8,
    }));
  }

  useEffect(() => {
    if (!visible) {
      particles.current = [];
    } else {
      const timer = setTimeout(() => {
        particles.current = [];
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible || particles.current.length === 0) return null;

  return (
    <View style={[styles.container, { left: originX, top: originY }]} pointerEvents="none">
      {particles.current.map((particle) => (
        <Particle key={particle.id} particle={particle} />
      ))}
    </View>
  );
}

function Particle({ particle }: { particle: Particle }) {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }))
    );
    translateX.value = withTiming(particle.x, { duration: 600, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(particle.y, { duration: 600, easing: Easing.out(Easing.ease) });
    scale.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0.5, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, [particle.x, particle.y]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
  },
});
