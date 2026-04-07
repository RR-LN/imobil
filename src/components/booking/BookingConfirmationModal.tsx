import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Property } from '../../services/supabase';
import { GlassCard } from '../ui/GlassCard';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  property: Property | null;
  date: string | null;
  time: string | null;
  agentName: string;
  isLoading: boolean;
}

export const BookingConfirmationModal: React.FC<Props> = ({
  visible, onClose, onConfirm, property, date, time, agentName, isLoading
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-MZ', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  if (!property || !date || !time) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn} style={styles.backdrop} />
        <Animated.View entering={FadeInUp} style={styles.content}>
          <GlassCard style={styles.card}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#8B988B" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={32} color="#5A6B5A" />
              </View>
              <Text style={styles.title}>Confirmar Visita</Text>
              <Text style={styles.subtitle}>Revise os detalhes antes de confirmar</Text>
            </View>

            <View style={styles.propertySection}>
              <Text style={styles.sectionLabel}>Propriedade</Text>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <Text style={styles.propertyLocation}>
                <Ionicons name="location" size={14} color="#A67B5B" /> {property.city}
              </Text>
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Ionicons name="calendar-outline" size={20} color="#5A6B5A" />
                <View>
                  <Text style={styles.dateTimeLabel}>Data</Text>
                  <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.dateTimeItem}>
                <Ionicons name="time-outline" size={20} color="#5A6B5A" />
                <View>
                  <Text style={styles.dateTimeLabel}>Hora</Text>
                  <Text style={styles.dateTimeValue}>{time}</Text>
                </View>
              </View>
            </View>

            <View style={styles.agentSection}>
              <Text style={styles.sectionLabel}>Agente</Text>
              <View style={styles.agentRow}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>{agentName[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.agentName}>{agentName}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]} 
                onPress={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFF" /> : (
                  <><Text style={styles.confirmButtonText}>Confirmar</Text>
                  <Ionicons name="checkmark" size={18} color="#FFF" /></>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  content: { width: '90%', maxWidth: 400 },
  card: { padding: 24 },
  closeButton: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F7F5F3', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(90,107,90,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#2D3A2D', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B988B', textAlign: 'center' },
  propertySection: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E8E4E0' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#8B988B', textTransform: 'uppercase', marginBottom: 8 },
  propertyTitle: { fontSize: 18, fontWeight: '600', color: '#2D3A2D', marginBottom: 4 },
  propertyLocation: { fontSize: 14, color: '#5A6B5A' },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E8E4E0' },
  dateTimeItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { width: 1, height: 40, backgroundColor: '#E8E4E0', marginHorizontal: 16 },
  dateTimeLabel: { fontSize: 12, color: '#8B988B' },
  dateTimeValue: { fontSize: 14, fontWeight: '600', color: '#2D3A2D' },
  agentSection: { marginBottom: 24 },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A67B5B', justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  agentName: { fontSize: 16, fontWeight: '500', color: '#2D3A2D' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F7F5F3', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#5A6B5A' },
  confirmButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#5A6B5A' },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
