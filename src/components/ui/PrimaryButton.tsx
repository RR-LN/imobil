import React from 'react';
import { Text, StyleSheet, ActivityIndicator, View, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/theme';
import { fontConfig } from '../../constants/fonts';

interface PrimaryButtonProps {
  onPress?: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({
  onPress,
  title,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.96, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: isOutline
      ? 'transparent'
      : isGhost
        ? 'transparent'
        : disabled
          ? theme.colors.text.muted
          : theme.colors.accent.gold,
    borderWidth: isOutline ? 1.5 : 0,
    borderColor: isOutline ? theme.colors.accent.gold : 'transparent',
    opacity: disabled ? 0.5 : 1,
    gap: theme.spacing.sm,
  };

  const textColor = isOutline || isGhost
    ? theme.colors.accent.gold
    : theme.colors.background.light;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <View style={containerStyle}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isOutline || isGhost ? theme.colors.accent.gold : theme.colors.background.light}
            />
          ) : (
            <>
              {iconLeft}
              <Text
                style={[
                  styles.text,
                  {
                    fontFamily: fontConfig.inter.semibold,
                    color: textColor,
                  },
                ]}
              >
                {title}
              </Text>
              {iconRight}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
});
