import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 80) / 7;

interface CalendarPickerProps {
  availableDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  availableDates,
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  maxDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Add empty slots for days before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Fill remaining slots
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    setCalendarDays(days);
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDate === dateStr;
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    // Disable if before minDate
    if (minDate && date < minDate) return true;
    
    // Disable if after maxDate
    if (maxDate && date > maxDate) return true;
    
    // Disable if not in available dates
    return !isDateAvailable(date);
  };

  const handleDatePress = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = date.toISOString().split('T')[0];
    onSelectDate(dateStr);
  };

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSameMonth = (date: Date) => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={goToPreviousMonth}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#5A6B5A" />
        </TouchableOpacity>
        
        <Text style={styles.monthText}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={goToNextMonth}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-forward" size={24} color="#5A6B5A" />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((date, index) => {
          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const available = isDateAvailable(date);
          const inCurrentMonth = isSameMonth(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !inCurrentMonth && styles.dayCellOtherMonth,
                selected && styles.dayCellSelected,
                disabled && styles.dayCellDisabled,
              ]}
              onPress={() => handleDatePress(date)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayText,
                  !inCurrentMonth && styles.dayTextOtherMonth,
                  selected && styles.dayTextSelected,
                  disabled && styles.dayTextDisabled,
                ]}
              >
                {date.getDate()}
              </Text>
              {available && !selected && !disabled && (
                <View style={styles.availableIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Disponivel</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotSelected]} />
          <Text style={styles.legendText}>Selecionado</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2D',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8B988B',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH + 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: '#5A6B5A',
    borderRadius: 12,
  },
  dayCellDisabled: {
    opacity: 0.2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3A2D',
  },
  dayTextOtherMonth: {
    color: '#8B988B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: '#C4B5A5',
  },
  availableIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A67B5B',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A67B5B',
  },
  legendDotSelected: {
    backgroundColor: '#5A6B5A',
  },
  legendText: {
    fontSize: 12,
    color: '#8B988B',
  },
});