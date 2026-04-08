import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
  Image,
  KeyboardAvoidingView,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  pickAndUploadImage,
  takePhoto,
  pickFromLibrary,
} from '../../services/imageUploadService';
import { sendMessage } from '../../services/chatService';
import type { Message } from '../../services/chatService';

interface ChatInputProps {
  conversationId: string;
  userId: string;
  onMessageSent?: () => void;
  onTyping?: (isTyping: boolean) => void;
  containerStyle?: ViewStyle;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  conversationId,
  userId,
  onMessageSent,
  onTyping,
  containerStyle,
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ uri: string; path: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const handleSendText = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error } = await sendMessage(conversationId, userId, content, 'text');
    if (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    } else {
      onMessageSent?.();
    }
  };

  const handlePickImage = async (source: 'camera' | 'library') => {
    setShowImagePicker(false);
    setIsUploading(true);

    try {
      let result;
      if (source === 'camera') {
        result = await takePhoto({ quality: 0.7 });
      } else {
        result = await pickFromLibrary({ quality: 0.7 });
      }

      if (result.canceled || !result.assets?.length) {
        setIsUploading(false);
        return;
      }

      const { uri } = result.assets[0];
      setPreviewImage({ uri, path: '' });

      // Upload to Supabase
      const upload = await pickAndUploadImage(source, `chat/${conversationId}`);
      
      if (upload.error || !upload.url) {
        throw upload.error || new Error('Upload failed');
      }

      setPreviewImage(null);

      // Send as message
      const { error: msgError } = await sendMessage(
        conversationId,
        userId,
        message.trim() || 'Imagem',
        'text',
        { imageUrl: upload.url, imagePath: upload.path }
      );

      if (msgError) throw msgError;

      setMessage('');
      onMessageSent?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível enviar a imagem');
    } finally {
      setIsUploading(false);
      setPreviewImage(null);
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    onTyping?.(text.length > 0);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage || isUploading}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isUploading) setPreviewImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {previewImage && (
              <Image source={{ uri: previewImage.uri }} style={styles.previewImage} />
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#5A6B5A" />
                <Text style={styles.uploadingText}>A enviar...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Adicionar imagem</Text>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => handlePickImage('camera')}
            >
              <Ionicons name="camera" size={24} color="#5A6B5A" />
              <Text style={styles.pickerText}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => handlePickImage('library')}
            >
              <Ionicons name="images" size={24} color="#5A6B5A" />
              <Text style={styles.pickerText}>Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Container */}
      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowImagePicker(true);
          }}
          disabled={isUploading}
        >
          <Ionicons name="camera" size={24} color="#5A6B5A" />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor="#8B988B"
            value={message}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || isUploading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendText}
          disabled={!message.trim() || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? '#FFF' : '#8B988B'}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F5F3',
    borderTopWidth: 1,
    borderTopColor: '#E8E4E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E4E0',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E4E0',
    maxHeight: 120,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2D3A2D',
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5A6B5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E8E4E0',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFF',
    marginTop: 12,
    fontSize: 16,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2D',
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4E0',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pickerText: {
    fontSize: 17,
    color: '#2D3A2D',
  },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#B85C5C',
  },
});
