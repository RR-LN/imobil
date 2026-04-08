import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { Video, ResizeMode, VideoReadyForDisplayEvent } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  style?: any;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri,
  thumbnail,
  autoPlay = false,
  loop = true,
  onPlaybackStatusUpdate,
  onFullscreenChange,
  style,
}) => {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
    showControlsTemporarily();
  };

  const handleMuteToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleProgressBarPress = (event: GestureResponderEvent) => {
    if (!videoRef.current || duration === 0) return;
    const { locationX } = event.nativeEvent;
    const newPosition = (locationX / SCREEN_W) * duration;
    videoRef.current.setPositionAsync(newPosition * 1000); // ms to seconds
  };

  const onVideoStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setProgress(status.positionMillis / status.durationMillis);
      setDuration(status.durationMillis);
      onPlaybackStatusUpdate?.(status);
    }
  };

  const onReadyForDisplay = (event: VideoReadyForDisplayEvent) => {
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={loop}
        shouldPlay={autoPlay}
        isMuted={isMuted}
        onPlaybackStatusUpdate={onVideoStatusUpdate}
        onReadyForDisplay={onReadyForDisplay}
        useNativeControls={false}
      />

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5A6B5A" />
        </View>
      )}

      {/* Touch Area */}
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={showControlsTemporarily}
      >
        {/* Play/Pause Button */}
        {showControls && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.centerControls}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={40}
                color="#FFF"
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom Controls */}
        {showControls && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.bottomControls}>
            {/* Progress Bar */}
            <TouchableOpacity
              style={styles.progressBarContainer}
              onPress={handleProgressBarPress}
              activeOpacity={1}
            >
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </TouchableOpacity>

            {/* Controls Row */}
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleMuteToggle}>
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  centerControls: {
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(90, 107, 90, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5,
  },
  bottomControls: {
    padding: 16,
    paddingBottom: 24,
  },
  progressBarContainer: {
    height: 4,
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#A67B5B',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});

export default VideoPlayer;
