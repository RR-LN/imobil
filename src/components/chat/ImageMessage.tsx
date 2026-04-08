import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ImageMessageProps {
  url: string;
  caption?: string;
  onPress?: () => void;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  url,
  caption,
  onPress,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFullscreen(true);
    onPress?.();
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
        <Animated.View entering={FadeIn}>
          <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={isFullscreen}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: url }} style={styles.fullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F7F5F3',
  },
  image: {
    width: 250,
    height: 180,
    borderRadius: 16,
  },
  caption: {
    padding: 12,
    fontSize: 14,
    color: '#2D3A2D',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
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
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});

export default ImageMessage;
