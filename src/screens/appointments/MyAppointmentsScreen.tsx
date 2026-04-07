import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../../store/authStore';
import { getBuyerBookings, cancelBooking } from '../../services/bookingsService';
import { BookingWithDetails } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';

export const MyAppointmentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const { bookings: data } = await getBuyerBookings(user.id);
      setBookings(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = (bookingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Cancelar Visita', 'Tem certeza?', [
      { text: 'Nao', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          await cancelBooking(bookingId);
          fetchBookings();
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4A7C5C';
      case 'pending': return '#B8962E';
      case 'completed': return '#5A7A9A';
      case 'cancelled': return '#B85C5C';
      default: return '#8B988B';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const filteredBookings = bookings.filter((b) => {
    const bookingDate = new Date(`${b.visit_date}T${b.visit_time}`);
    const now = new Date();
    return activeTab === 'upcoming' 
      ? bookingDate >= now && b.status !== 'cancelled'
      : bookingDate < now || b.status === 'cancelled';
  }).sort((a, b) => {
    const dateA = new Date(`${a.visit_date}T${a.visit_time}`);
    const dateB = new Date(`${b.visit_date}T${b.visit_time}`);
    return activeTab === 'upcoming' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });

  const renderCard = ({ item, index }: { item: BookingWithDetails; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50)}>
      <GlassCard style={styles.card}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        
        <Text style={styles.propertyTitle}>{item.property?.title || 'Propriedade'}</Text>
        <Text style={styles.propertyLocation}>{item.property?.city}</Text>
        
        <View style={styles.dateRow}>
          <Ionicons name="calendar" size={16} color="#5A6B5A" />
          <Text style={styles.dateText}>{formatDate(item.visit_date)} as {item.visit_time}</Text>
        </View>

        <View style={styles.agentRow}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarText}>{item.agent?.full_name?.[0]?.toUpperCase() || 'A'}</Text>
          </View>
          <Text style={styles.agentName}>{item.agent?.full_name || 'Agente'}</Text>
        </View>

        {activeTab === 'upcoming' && item.status !== 'cancelled' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelText}>Cancelar Visita</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5A6B5A" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2D3A2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Visitas</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Proximas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Passadas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color="#C4B5A5" />
            <Text style={styles.emptyTitle}>Nenhuma visita</Text>
            <Text style={styles.emptyText}>Agende uma visita para ver propriedades</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F3' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2D3A2D' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#FFF', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#5A6B5A' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#5A6B5A' },
  tabTextActive: { color: '#FFF' },
  list: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 16, padding: 20 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#FFF', textTransform: 'uppercase' },
  propertyTitle: { fontSize: 18, fontWeight: '600', color: '#2D3A2D', marginBottom: 4 },
  propertyLocation: { fontSize: 14, color: '#8B988B', marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dateText: { fontSize: 14, color: '#5A6B5A', fontWeight: '500' },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  
  agentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#A67B5B', justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  agentName: { fontSize: 14, fontWeight: '500', color: '#2D3A2D' },
  cancelBtn: { backgroundColor: 'rgba(184,92,92,0.1)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#B85C5C' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2D3A2D', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#8B988B', marginTop: 8, textAlign: 'center' }
});
