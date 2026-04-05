import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '../../store/authStore';
import { ConversationWithDetails } from '../../services/chatService';
import {
  getConversations,
  subscribeToConversations,
  unsubscribe,
} from '../../services/chatService';
import { formatPrice } from '../../services/propertiesService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeStack';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt', { day: '2-digit', month: 'short' });
};

export const ConversationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { user, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    const { conversations: convs, error: err } = await getConversations(user.id);

    if (err) {
      setError('Erro ao carregar conversas');
      setIsLoading(false);
      return;
    }

    setConversations(convs);
    setError(null);
    setIsLoading(false);
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    loadConversations();
  }, [isAuthenticated, loadConversations]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToConversations(user.id, () => {
      loadConversations();
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
      }
    };
  }, [user?.id, loadConversations]);

  // Handle refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  // Navigate to chat
  const handleConversationPress = (conversation: ConversationWithDetails) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      propertyId: conversation.property_id,
    });
  };

  // Get other participant info
  const getOtherParticipant = (conversation: ConversationWithDetails) => {
    if (!user) return null;
    if (conversation.buyer_id === user.id) {
      return conversation.seller;
    }
    return conversation.buyer;
  };

  // Get other participant name
  const getOtherParticipantName = (conversation: ConversationWithDetails) => {
    const other = getOtherParticipant(conversation);
    return other?.full_name || 'Utilizador';
  };

  // Get other participant initials
  const getOtherParticipantInitials = (conversation: ConversationWithDetails) => {
    const other = getOtherParticipant(conversation);
    if (!other?.full_name) return '?';
    const names = other.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Render conversation item
  const renderConversation = useCallback(
    ({ item }: { item: ConversationWithDetails }) => {
      const otherName = getOtherParticipantName(item);
      const otherInitials = getOtherParticipantInitials(item);
      const lastMessage = item.last_message;
      const unreadCount = item.unread_count || 0;
      const hasUnread = unreadCount > 0;

      return (
        <TouchableOpacity
          style={[styles.conversationItem, hasUnread && styles.conversationItemUnread]}
          onPress={() => handleConversationPress(item)}
          activeOpacity={0.8}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={hasUnread ? [colors.terra, colors.ochre] : [colors.forestMid, colors.forest]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{otherInitials}</Text>
            </LinearGradient>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.conversationContent}>
            {/* Top row: Name + Time */}
            <View style={styles.conversationHeader}>
              <Text
                style={[styles.conversationName, hasUnread && styles.conversationNameUnread]}
                numberOfLines={1}
              >
                {otherName}
              </Text>
              {lastMessage && (
                <Text style={styles.conversationTime}>
                  {formatRelativeTime(lastMessage.created_at)}
                </Text>
              )}
            </View>

            {/* Property */}
            {item.property && (
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {item.property.title}
              </Text>
            )}

            {/* Last message preview */}
            {lastMessage && (
              <View style={styles.messagePreview}>
                <Text
                  style={[styles.messageText, hasUnread && styles.messageTextUnread]}
                  numberOfLines={1}
                >
                  {lastMessage.type === 'booking'
                    ? '📅 Visita agendada'
                    : lastMessage.content}
                </Text>
                {hasUnread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [user?.id]
  );

  const keyExtractor = useCallback((item: ConversationWithDetails) => item.id, []);

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.headerTitle}>Mensagens</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Inicia sessao</Text>
          <Text style={styles.emptyText}>
            Entra na tua conta para ver as tuas conversas
          </Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.headerTitle}>Mensagens</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.terra} />
          <Text style={styles.loadingText}>A carregar conversas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        {conversations.length > 0 && (
          <Text style={styles.headerCount}>{conversations.length} activas</Text>
        )}
      </View>

      {/* LIST */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.terra]}
            tintColor={colors.terra}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Sem conversas</Text>
            <Text style={styles.emptyText}>
              As tuas conversas aparecerem aqui quando comecares a falar com vendedores
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },

  // HEADER
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    color: colors.charcoal,
    lineHeight: 32,
  },
  headerCount: {
    fontSize: typography.sizes.sm,
    color: colors.lightMid,
    marginTop: spacing.xs,
  },

  // LIST
  listContent: {
    flexGrow: 1,
  },

  // CONVERSATION ITEM
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  conversationItemUnread: {
    backgroundColor: colors.cream,
  },

  // AVATAR
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.terra,
    borderWidth: 2,
    borderColor: colors.white,
  },

  // CONTENT
  conversationContent: {
    flex: 1,
    minWidth: 0,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.charcoal,
  },
  conversationNameUnread: {
    fontWeight: typography.weights.semibold,
  },
  conversationTime: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginLeft: spacing.sm,
  },
  propertyTitle: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
    marginBottom: 2,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.lightMid,
  },
  messageTextUnread: {
    color: colors.charcoal,
    fontWeight: typography.weights.medium,
  },
  unreadBadge: {
    backgroundColor: colors.terra,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.mid,
    textAlign: 'center',
    lineHeight: 22,
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
});

export default ConversationsScreen;
