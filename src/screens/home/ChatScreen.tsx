import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '../../store/authStore';
import { Message, Conversation } from '../../services/chatService';
import {
  getConversation,
  getMessages,
  sendMessage,
  subscribeToMessages,
  unsubscribe,
  markMessagesAsRead,
} from '../../services/chatService';
import { getPropertyById, formatPrice } from '../../services/propertiesService';
import { notificationService } from '../../services/notificationService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { Property } from '../../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HomeStackParamList, 'Chat'>>();
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { conversationId, propertyId } = route.params || {};
  const { user, isAuthenticated } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Load conversation and messages
  useEffect(() => {
    const loadData = async () => {
      if (!conversationId) {
        setError('ID da conversa nao fornecido');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Load conversation details
      const { conversation: conv, error: convError } = await getConversation(conversationId);

      if (convError || !conv) {
        setError('Erro ao carregar conversa');
        setIsLoading(false);
        return;
      }

      setConversation(conv);

      // Load property if we have property_id
      if (conv.property_id) {
        const { property: prop } = await getPropertyById(conv.property_id);
        setProperty(prop);
      }

      // Load messages
      const { messages: msgs, error: msgsError } = await getMessages(conversationId);

      if (msgsError) {
        setError('Erro ao carregar mensagens');
        setIsLoading(false);
        return;
      }

      setMessages(msgs);

      // Mark messages as read
      if (user?.id) {
        await markMessagesAsRead(conversationId, user.id);
      }

      setIsLoading(false);
    };

    loadData();
  }, [conversationId, user?.id]);

    // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = subscribeToMessages(conversationId, async (newMessage: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Mark as read if it's from the other person
      if (user?.id && newMessage.sender_id !== user.id) {
        markMessagesAsRead(conversationId, user.id);
      }

      // Send push notification if message is from other user and app might be in background
      if (user?.id && newMessage.sender_id !== user.id) {
        const otherParticipant = getOtherParticipant();
        const otherName = otherParticipant?.full_name || 'Utilizador';
        const preview = newMessage.content.length > 50 
          ? `${newMessage.content.substring(0, 50)}...` 
          : newMessage.content;
          
        await notificationService.schedulePushNotification(
          `Nova mensagem de ${otherName}`,
          preview,
          {
            type: 'chat',
            conversationId
          }
        );
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
      }
    };
  }, [conversationId, user?.id]);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !conversationId || !user?.id || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    const { error: sendError } = await sendMessage(
      conversationId,
      user.id,
      content,
      'text'
    );

    if (sendError) {
      Alert.alert('Erro', 'Nao foi possivel enviar a mensagem');
      setInputText(content); // Restore text on error
    }

    setIsSending(false);
  }, [inputText, conversationId, user?.id, isSending]);

  // Get other participant info
  const getOtherParticipant = () => {
    if (!conversation || !user) return null;

    if (conversation.buyer_id === user.id) {
      return conversation.seller;
    }
    return conversation.buyer;
  };

  // Get other participant name
  const getOtherParticipantName = () => {
    const other = getOtherParticipant();
    return other?.full_name || 'Utilizador';
  };

  // Get other participant initials
  const getOtherParticipantInitials = () => {
    const other = getOtherParticipant();
    if (!other?.full_name) return '?';
    const names = other.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Format message time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' });
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.loadingHeader}>
            <ActivityIndicator size="small" color={colors.terra} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.terra} />
          <Text style={styles.loadingText}>A carregar conversa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render message bubble
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = user?.id === item.sender_id;

      // Booking message card
      if (item.type === 'booking') {
        const metadata = item.metadata || {};
        return (
          <View style={styles.bookingCard}>
            <View style={styles.bookingIcon}>
              <Text style={styles.bookingIconText}>📅</Text>
            </View>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingTitle}>Visita Agendada</Text>
              <Text style={styles.bookingDate}>
                {metadata.date || 'Data nao disponivel'}
              </Text>
              {metadata.time && (
                <Text style={styles.bookingTime}>{metadata.time}</Text>
              )}
            </View>
          </View>
        );
      }

      // System message
      if (item.type === 'system') {
        return (
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
        );
      }

      // Regular text message
      return (
        <View
          style={[
            styles.messageContainer,
            isMe ? styles.messageRight : styles.messageLeft,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.bubbleSent : styles.bubbleReceived,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMe ? styles.messageTextSent : styles.messageTextReceived,
              ]}
            >
              {item.content}
            </Text>
          </View>
          {isMe && <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>}
        </View>
      );
    },
    [user?.id]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Get property info for card
  const getPropertyCardInfo = () => {
    if (property) {
      return {
        name: property.title,
        price: formatPrice(property.price, property.currency),
      };
    }
    if (conversation?.property) {
      return {
        name: conversation.property.title,
        price: formatPrice(conversation.property.price, conversation.property.currency),
      };
    }
    return null;
  };

  const propertyCardInfo = getPropertyCardInfo();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={[colors.terra, colors.ochre]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{getOtherParticipantInitials()}</Text>
        </LinearGradient>

        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{getOtherParticipantName()}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>

      {/* PROPERTY CARD */}
      {propertyCardInfo && (
        <View style={styles.propertyCard}>
          <LinearGradient
            colors={[colors.forestMid, colors.terraLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.propertyThumbnail}
          />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName} numberOfLines={1}>
              {propertyCardInfo.name}
            </Text>
            <Text style={styles.propertyPrice}>{propertyCardInfo.price}</Text>
          </View>
        </View>
      )}

      {/* MESSAGES LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        inverted
        onContentSizeChange={() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptySubtext}>Comeca a conversa!</Text>
          </View>
        }
      />

      {/* INPUT AREA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Escreve uma mensagem..."
            placeholderTextColor={colors.lightMid}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.charcoal,
    lineHeight: 22,
  },
  loadingHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    fontSize: 8,
    color: colors.forestLight,
    marginRight: 4,
    lineHeight: 10,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    color: colors.forestLight,
    fontWeight: typography.weights.medium,
  },

  // PROPERTY CARD
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyThumbnail: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: 2,
  },
  propertyPrice: {
    fontSize: typography.sizes.xs,
    color: colors.terra,
    fontWeight: typography.weights.medium,
  },

  // MESSAGES LIST
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  messageContainer: {
    maxWidth: '78%',
    marginBottom: spacing.sm,
  },
  messageLeft: {
    alignSelf: 'flex-start',
  },
  messageRight: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleReceived: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderTopLeftRadius: 2,
  },
  bubbleSent: {
    backgroundColor: colors.terra,
    borderRadius: 12,
    borderTopRightRadius: 2,
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: 20,
  },
  messageTextReceived: {
    color: colors.charcoal,
  },
  messageTextSent: {
    color: colors.white,
  },
  messageTime: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginTop: 4,
    textAlign: 'right',
  },

  // BOOKING CARD
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.forestLight,
    borderRadius: 10,
    padding: spacing.md,
    marginVertical: spacing.sm,
    alignSelf: 'center',
    maxWidth: '85%',
    ...shadows.sm,
  },
  bookingIcon: {
    marginRight: spacing.sm,
  },
  bookingIconText: {
    fontSize: 20,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: typography.sizes.xs,
    color: colors.mid,
  },
  bookingTime: {
    fontSize: typography.sizes.xs,
    color: colors.terra,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },

  // SYSTEM MESSAGE
  systemMessage: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemMessageText: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
  },

  // LOADING STATE
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginTop: spacing.md,
  },

  // ERROR STATE
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.mid,
    textAlign: 'center',
  },

  // INPUT AREA
  keyboardAvoidingView: {
    backgroundColor: colors.warmWhite,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.charcoal,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.terra,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightMid,
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 16,
    color: colors.white,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
  },
});

export default ChatScreen;
