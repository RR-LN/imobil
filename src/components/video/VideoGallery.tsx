import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { VideoThumbnail } from './VideoThumbnail';
import { VideoPlayer } from './VideoPlayer';
import { getPropertyVideos } from '../../services/videoUploadService';
import { pickAndUploadVideo } from '../../services/videoUploadService';
import { useAuthStore } from '../../store/authStore';
import { Alert } from 'react-native';

interface VideoGalleryProps {
  propertyId: string;
  ownerId: string;
}

const { width: SCREEN_W } = Dimensions.get('window');

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  propertyId,
  ownerId,
}) => {
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isOwner = user?.id === ownerId;

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    const videoList = await getPropertyVideos(propertyId);
    setVideos(videoList);
    setIsLoading(false);
  }, [propertyId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleUpload = async () => {
    if (!user || !isOwner) {
      Alert.alert('Erro', 'Apenas o proprietário pode adicionar vídeos');
      return;
    }

    setIsUploading(true);
    const result = await pickAndUploadVideo(propertyId, user.id);
    setIsUploading(false);

    if (result.error) {
      Alert.alert('Erro', 'Não foi possível fazer upload do vídeo');
    } else {
      fetchVideos();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleVideoPress = (video: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideo(video);
    setIsFullscreen(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A6B5A" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tour Virtual</Text>
          {isOwner && (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#5A6B5A" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#5A6B5A" />
                  <Text style={styles.uploadText}>Adicionar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off" size={48} color="#C4B5A5" />
            <Text style={styles.emptyText}>Nenhum vídeo disponível</Text>
            {isOwner && (
              <TouchableOpacity style={styles.addFirstBtn} onPress={handleUpload}>
                <Text style={styles.addFirstText}>Adicionar primeiro vídeo</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {videos.map((video, index) => (
              <Animated.View
                key={video.id}
                entering={FadeInUp.delay(index * 100)}
                style={styles.videoCard}
              >
                <VideoThumbnail
                  uri={video.video_url}
                  thumbnail={video.thumbnail_url}
                  duration={video.duration || '2:30'}
                  views={video.views || 0}
                  onPress={() => handleVideoPress(video)}
                  style={styles.videoThumbnail}
                />
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Fullscreen Video Modal */}
      <Modal
        visible={isFullscreen}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>

          {/* Video Player */}
          {selectedVideo && (
            <VideoPlayer
              uri={selectedVideo.video_url}
              thumbnail={selectedVideo.thumbnail_url}
              autoPlay={true}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  // Update view count
                }
              }}
              style={styles.fullScreenPlayer}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3A2D',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7F5F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6B5A',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  videoCard: {
    width: 280,
  },
  videoThumbnail: {
    width: 280,
    height: 180,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8B988B',
    marginTop: 12,
  },
  addFirstBtn: {
    marginTop: 16,
    backgroundColor: '#5A6B5A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullScreenPlayer: {
    width: SCREEN_W,
    height: SCREEN_W * 0.6,
  },
});

export default VideoGallery;
