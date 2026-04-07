import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedTime,
  onSelectTime,
}) => {
  const handlePress = (time: string, available: boolean) => {
    if (!available) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTime(time);
  };

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={40} color="#C4B5A5" />
        <Text style={styles.emptyTitle}>Sem horários disponíveis</Text>
        <Text style={styles.emptyText}>
          Selecione outra data ou tente novamente mais tarde.
        </Text>
      </View>
    );
  }

  // Group slots by morning/afternoon
  const morningSlots = slots.filter((s) => parseInt(s.time.split(':')[0]) < 12);
  const afternoonSlots = slots.filter((s) => parseInt(s.time.split(':')[0]) >= 12);

  const renderSlots = (title: string, slotGroup: TimeSlot[], delay: number) => (
    <Animated.View entering={FadeInUp.delay(delay)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.slotsGrid}>
        {slotGroup.map((slot, index) => {
          const isSelected = selectedTime === slot.time;
          
          return (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.slot,
                !slot.available && styles.slotUnavailable,
                isSelected && styles.slotSelected,
              ]}
              onPress={() => handlePress(slot.time, slot.available)}
              disabled={!slot.available}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timeText,
                  !slot.available && styles.timeTextUnavailable,
                  isSelected && styles.timeTextSelected,
                ]}
              >
                {slot.time}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
              {!slot.available && !isSelected && (
                <Text style={styles.unavailableText}>Ocupado</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {morningSlots.length > 0 && renderSlots('Manhã', morningSlots, 100)}
      {afternoonSlots.length > 0 && renderSlots('Tarde', afternoonSlots, 200)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A2D',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: '22%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F7F5F3',
    borderWidth: 1,
    borderColor: '#E8E4E0',
  },
  slotUnavailable: {
    backgroundColor: '#F0EBE5',
    borderColor: '#E8E4E0',
  },
  slotSelected: {
    backgroundColor: '#5A6B5A',
    borderColor: '#5A6B5A',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3A2D',
  },
  timeTextUnavailable: {
    color: '#C4B5A5',
  },
  timeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  unavailableText: {
    fontSize: 9,
    color: '#B85C5C',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2D',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B988B',
    textAlign: 'center',
    marginTop: 8,
  },
});
