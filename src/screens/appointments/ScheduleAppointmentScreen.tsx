import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Property } from '../../services/supabase';
import { createBooking } from '../../services/bookingsService';
import { getAgentAvailabilityForDate } from '../../services/agentAvailabilityService';
import { CalendarPicker } from '../../components/booking/CalendarPicker';
import { TimeSlotPicker } from '../../components/booking/TimeSlotPicker';
import { BookingConfirmationModal } from '../../components/booking/BookingConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/theme';
import { HomeStackParamList } from '../../navigation/HomeStack';

type Props = NativeStackScreenProps<HomeStackParamList, 'Booking'>;

export const ScheduleAppointmentScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user } = useAuthStore();
  const { propertyId, property, agentId, agentName } = route.params || {};

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notes, setNotes] = useState('');

  // Generate next 30 days as available dates
  useEffect(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setAvailableDates(dates);
  }, []);

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate && agentId) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

  const fetchTimeSlots = async () => {
    if (!selectedDate || !agentId) return;
    
    setIsLoading(true);
    setSelectedTime(null);
    
    try {
      const slots = await getAgentAvailabilityForDate(agentId, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar os horarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Selecao incompleta', 'Por favor selecione uma data e horario');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConfirmation(true);
  };

  const handleCreateBooking = async () => {
    if (!user || !property || !selectedDate || !selectedTime || !agentId) return;

    setIsCreating(true);

    try {
      const { booking, error } = await createBooking({
        property_id: propertyId,
        buyer_id: user.id,
        agent_id: agentId,
        visit_date: selectedDate,
        visit_time: selectedTime,
        notes: notes || undefined,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Visita Agendada!',
        `Sua visita foi agendada para ${selectedDate} as ${selectedTime}.\n\nEnviaremos uma confirmacao em breve.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowConfirmation(false);
              navigation.navigate('Conversations');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert('Erro', error.message || 'Nao foi possivel agendar a visita');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2D3A2D" />
        </TouchableOpacity>
        <Text style={styles.title}>Agendar Visita</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Property Card */}
        {property && (
          <Animated.View entering={FadeInUp} style={styles.propertyCard}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyLocation}>{property.city}</Text>
          </Animated.View>
        )}

        {/* Calendar */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>1. Selecione a Data</Text>
          <CalendarPicker
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </Animated.View>

        {/* Time Slots */}
        {selectedDate && (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>2. Selecione o Horario</Text>
            {isLoading ? (
              <ActivityIndicator color="#5A6B5A" style={styles.loader} />
            ) : (
              <TimeSlotPicker
                slots={availableSlots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            )}
          </Animated.View>
        )}

        {/* Continue Button */}
        {selectedTime && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: theme.colors.primary.mid }]}
              onPress={handleContinue}
            >
              <Text style={styles.continueBtnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirmation Modal */}
      <BookingConfirmationModal
        visible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleCreateBooking}
        property={property || null}
        date={selectedDate}
        time={selectedTime}
        agentName={agentName || 'Agente'}
        isLoading={isCreating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3A2D',
  },
  placeholder: {
    width: 44,
  },
  propertyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  propertyTitle: {
    fontSize: 18,
