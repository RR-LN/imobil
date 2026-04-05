import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/theme';

interface GlassCardProps {
  children: ReactNode;
  intensity?: number;
  borderColor?: string;
  style?: ViewStyle;
  pressable?: boolean;
}

export function GlassCard({
  children,
  intensity = 50,
  borderColor,
  style,
}: GlassCardProps) {
  const theme = useTheme();

  const resolvedBorderColor = borderColor ?? theme.colors.glass.borderLight;

  return (
    <View style={[styles.wrapper, { borderRadius: 20 }, style]}>
      <BlurView
        intensity={intensity}
        tint={theme.isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <LinearGradient
        colors={[
          theme.isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.65)',
          theme.isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.45)',
        ]}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View style={[styles.content, { borderColor: resolvedBorderColor }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  content: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: 'transparent',
  },
});
