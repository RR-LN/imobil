import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, textStyles } from '../../constants/theme';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initials?: string;
  imageUrl?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

const sizeMap = {
  sm: 28,
  md: 32,
  lg: 40,
  xl: 56,
};

const fontSizeMap = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 20,
};

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  initials,
  imageUrl,
  backgroundColor,
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    // Generate a consistent color from initials
    if (initials) {
      const colors_array = [colors.terra, colors.forest, colors.ochre, colors.mid];
      const index = initials.charCodeAt(0) % colors_array.length;
      return colors_array[index];
    }
    return colors.terra;
  };

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { borderRadius: dimension / 2 }]}
        />
      ) : initials ? (
        <Text
          style={[
            styles.initials,
            { fontSize },
          ]}
        >
          {initials}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    ...textStyles.body,
    fontWeight: typography.weights.semibold,
    color: colors.warmWhite,
  },
});

export default Avatar;
