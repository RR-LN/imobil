import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { Message, getMessages, sendMessage, markMessagesAsRead, subscribeToMessages, Conversation, getConversation } from '../../services/chatService';

export const ChatScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  const otherUser = conversation?.buyer?.id === user?.id ? conversation?.seller : conversation?.buyer;

  useEffect(() => { fetchData(); }, [conversationId]);
  
  useEffect(() => {
    if (!conversationId) return;
    channelRef.current = subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user?.id) {
        markMessagesAsRead(conversationId, user?.id || '');
      }
      scrollToBottom();
    });
    return () => { channelRef.current?.unsubscribe(); };
  }, [conversationId, user?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [convRes, msgRes] = await Promise.all([
        getConversation(conversationId), getMessages(conversationId, 50),
      ]);
      if (convRes.conversation) setConversation(convRes.conversation);
      if (msgRes.messages) { setMessages(msgRes.messages); markMessagesAsRead(conversationId, user?.id || ''); }
    } finally { setIsLoading(false); }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const { message, error } = await sendMessage(conversationId, user.id, content);
      if (error) throw error;
      if (message) setMessages(prev => [...prev, message]);
    } catch (err) { setNewMessage(content); }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    setOtherUserTyping(true);
    setTimeout(() => setOtherUserTyping(false), 1500);
  };

  const isOwnMessage = (msg: Message) => msg.sender_id === user?.id;
  const scrollToBottom = () => flatListRef.current?.scrollToEnd({ animated: true });

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = isOwnMessage(item);
    return (
      <Animated.View entering={FadeInUp.delay(50)} style={[styles.msgContainer, isOwn ? styles.ownMsg : styles.otherMsg]}>
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.msgText, isOwn ? styles.ownText : styles.otherText]}>{item.content}</Text>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString('pt-MZ', {hour: '2-digit', minute: '2-digit'})}</Text>
        </View>
      </Animated.View>
    );
  };

  if (isLoading) return (
    <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#5A6B5A" />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2D3A2D" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{otherUser?.full_name?.[0]?.toUpperCase()}</Text></View>
          <View>
            <Text style={styles.userName}>{otherUser?.full_name}</Text>
            {otherUserTyping && <Text style={styles.typing}>a escrever...</Text>}
          </View>
        </View>
      </View>
      <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList} onContentSizeChange={scrollToBottom} />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Escreva uma mensagem..." placeholderTextColor="#8B988B"
          value={newMessage} onChangeText={handleTyping} multiline />
        <TouchableOpacity style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!newMessage.trim()}>
          <Ionicons name="send" size={20} color={newMessage.trim() ? '#FFF' : '#C4B5A5'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F3' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8E4E0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5A6B5A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  userName: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#2D3A2D' },
  typing: { marginLeft: 12, fontSize: 12, color: '#8B988B', fontStyle: 'italic' },
  messagesList: { padding: 16, paddingBottom: 100 },
  msgContainer: { marginBottom: 12, maxWidth: '80%' },
  ownMsg: { alignSelf: 'flex-end' },
  otherMsg: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  ownBubble: { backgroundColor: '#5A6B5A', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E8E4E0' },
  msgText: { fontSize: 15, lineHeight: 20 },
  ownText: { color: '#FFF' },
  otherText: { color: '#2D3A2D' },
  time: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E8E4E0' },
  input: { flex: 1, backgroundColor: '#F7F5F3', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, maxHeight: 100, fontSize: 15, color: '#2D3A2D' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#5A6B5A', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  sendBtnDisabled: { backgroundColor: '#E8E4E0' },
});
