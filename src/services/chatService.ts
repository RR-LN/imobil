import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface Conversation {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at?: string;
  // Joined data
  property?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    city: string;
  };
  buyer?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  seller?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'booking' | 'system';
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface ConversationWithDetails extends Conversation {
  unread_count?: number;
}

// ============================================
// CONVERSATION FUNCTIONS
// ============================================

/**
 * Get or create a conversation for a property
 */
export const getOrCreateConversation = async (
  propertyId: string,
  sellerId: string,
  buyerId: string
) => {
  try {
    // First check if conversation exists
    const { data: existing, error: queryError } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(id, title, price, currency, images, city)
      `)
      .eq('property_id', propertyId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (queryError) throw queryError;

    if (existing) {
      return { conversation: existing as Conversation, error: null, isNew: false };
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        property_id: propertyId,
        buyer_id: buyerId,
        seller_id: sellerId,
      })
      .select(`
        *,
        property:properties(id, title, price, currency, images, city)
      `)
      .single();

    if (error) throw error;

    return { conversation: data as Conversation, error: null, isNew: true };
  } catch (error: any) {
    console.error('Get or create conversation error:', error);
    return { conversation: null, error, isNew: false };
  }
};

/**
 * Get a single conversation by ID with details
 */
export const getConversation = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(id, title, price, currency, images, city),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url),
        seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url)
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    return { conversation: data as Conversation, error: null };
  } catch (error: any) {
    console.error('Get conversation error:', error);
    return { conversation: null, error };
  }
};

/**
 * Get all conversations for a user
 */
export const getConversations = async (userId: string) => {
  try {
    // Get conversations where user is buyer or seller
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(id, title, price, currency, images, city),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url),
        seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url),
        last_message:messages(
          id,
          content,
          type,
          created_at,
          sender_id
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      (data || []).map(async (conv) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null);

        return {
          ...conv,
          unread_count: count || 0,
        };
      })
    );

    return { conversations: conversationsWithUnread as ConversationWithDetails[], error: null };
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return { conversations: [], error };
  }
};

// ============================================
// MESSAGE FUNCTIONS
// ============================================

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { messages: data as Message[], error: null };
  } catch (error: any) {
    console.error('Get messages error:', error);
    return { messages: [], error };
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  type: 'text' | 'booking' | 'system' = 'text',
  metadata?: Record<string, any>
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { message: data as Message, error: null };
  } catch (error: any) {
    console.error('Send message error:', error);
    return { message: null, error };
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    return { error };
  }
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new messages in a conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Message) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to conversation updates (for list view)
 */
export const subscribeToConversations = (
  userId: string,
  callback: () => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(buyer_id.eq.${userId},seller_id.eq.${userId})`,
      },
      () => {
        callback();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribe = async (channel: RealtimeChannel) => {
  try {
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error('Unsubscribe error:', error);
  }
};

// ============================================
// OLD FUNCTIONS (kept for compatibility)
// ============================================

/**
 * Create a new conversation (legacy)
 */
export const createConversation = async (
  propertyId: string,
  buyerId: string,
  sellerId: string
) => {
  return getOrCreateConversation(propertyId, sellerId, buyerId);
};
