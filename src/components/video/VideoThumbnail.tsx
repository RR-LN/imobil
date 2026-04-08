import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface VideoThumbnailProps {
  uri: string;
  thumbnail?: string;
  duration?: string;
  views?: number;
  onPress?: () => void;
  style?: any;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  uri,
  thumbnail,
  duration,
  views,
  onPress,
  style,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View entering={FadeIn} style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.9}
      >
        {/* Thumbnail or Gradient Placeholder */}
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="videocam" size={32} color="#8B988B" />
          </View>
        )}

        {/* Play Button Overlay */}
        <View style={[styles.overlay, isPressed && styles.overlayPressed]}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={28} color="#FFF" style={styles.playIcon} />
          </View>
        </View>

        {/* Duration Badge */}
        {duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        )}

        {/* Views Badge */}
        {views !== undefined && views > 0 && (
          <View style={styles.viewsBadge}>
            <Ionicons name="eye" size={12} color="#FFF" />
            <Text style={styles.viewsText}>{formatViews(views)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const formatViews = (views: number): string => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return views.toString();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8E4E0',
  },
  touchable: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#E8E4E0',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F5F3',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayPressed: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(90, 107, 90, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  playIcon: {
    marginLeft: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewsText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default VideoThumbnail;
