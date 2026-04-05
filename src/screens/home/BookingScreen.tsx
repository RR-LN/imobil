import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { notificationService } from '../../services/notificationService';
import { getPropertyById } from '../../services/propertiesService';
import { getProfile, getCurrentUser } from '../../services/authService';
import { createBooking } from '../../services/bookingsService';
import { Property, Profile } from '../../services/supabase';
import { isWeb, getContainerMaxWidth, scaleSpacing } from '../../utils/responsive';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayInfo {
  day: number;
  isToday: boolean;
  isAvailable: boolean;
}

const WEEK_DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TIME_SLOTS: TimeSlot[] = [
  { time: '08h00', available: true },
  { time: '10h00', available: true },
  { time: '12h00', available: false },
  { time: '14h00', available: true },
  { time: '16h00', available: true },
  { time: '18h00', available: false },
];

// Helper functions
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const isToday = (year: number, month: number, day: number): boolean => {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
};

const isDateAvailable = (day: number): boolean => {
  // Mock: weekends and some weekdays are available
  return day % 2 === 0 || day % 3 === 0;
};

export const BookingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HomeStackParamList, 'Booking'>>();

  const { propertyId } = route.params || {};

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [agentProfile, setAgentProfile] = useState<Profile | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Fetch property and agent data
  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId) {
        setError('ID da propriedade não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current user (buyer)
        const { user } = await getCurrentUser();
        if (!user) {
          throw new Error('Utilizador não autenticado');
        }

        // Fetch buyer profile
        const { profile: buyer, error: buyerError } = await getProfile(user.id);
        if (buyerError || !buyer) {
          throw new Error(buyerError?.message || 'Perfil de comprador não encontrado');
        }
        setBuyerProfile(buyer);

        // Fetch property
        const { property: prop, error: propError } = await getPropertyById(propertyId);
        if (propError || !prop) {
          throw new Error(propError?.message || 'Propriedade não encontrada');
        }
        setProperty(prop);

        // Fetch agent profile if property has owner_id
        if (prop.owner_id) {
          const { profile, error: profileError } = await getProfile(prop.owner_id);
          if (profileError || !profile) {
            console.warn('Failed to fetch agent profile:', profileError);
            // Continue without agent info
          } else {
            setAgentProfile(profile);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados da propriedade');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
    setSelectedSlot(null);
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
    setSelectedSlot(null);
  }, [year, month]);

  const handleDayPress = useCallback((day: number) => {
    setSelectedDay(day);
    setSelectedSlot(null);
  }, []);

  const handleSlotPress = useCallback((time: string) => {
    setSelectedSlot(time);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedDay || !selectedSlot || !propertyId || !property || !buyerProfile || !agentProfile) {
      Alert.alert('Erro', 'Dados incompletos para agendamento');
      return;
    }

    setIsLoadingConfirm(true);

    try {
      // Parse selectedSlot (e.g., "08h00" -> 8, 0)
      const timeMatch = selectedSlot.match(/(\d{1,2})h(\d{2})/);
      if (!timeMatch) {
        throw new Error('Formato de hora inválido');
      }
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);

      // Create scheduled_at ISO string
      const scheduledAt = new Date(year, month, selectedDay, hours, minutes).toISOString();

      // Create booking via service
      const { booking, error } = await createBooking({
        property_id: propertyId,
        buyer_id: buyerProfile.id,
        agent_id: agentProfile.id,
        visit_date: new Date(year, month, selectedDay).toISOString().split('T')[0],
        visit_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      });

      if (error || !booking) {
        throw new Error(error instanceof Error ? error.message : 'Erro ao criar agendamento');
      }

      // Schedule success notification
      const formattedDate = new Date(year, month, selectedDay).toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      notificationService.schedulePushNotification(
        'Visita confirmada!',
        `A tua visita foi marcada para ${formattedDate} às ${selectedSlot}`,
        {
          type: 'booking',
          bookingId: booking.id,
        }
      );

      Alert.alert(
        'Sucesso',
        'Agendamento confirmado! Serás notificado no dia.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(), // Go back to property detail
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível criar o agendamento. Tenta novamente.');
    } finally {
      setIsLoadingConfirm(false);
    }
  }, [navigation, year, month, selectedDay, selectedSlot, propertyId, property, buyerProfile, agentProfile]);

  const renderCalendarDays = () => {
    const days: React.ReactElement[] = [];
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDate = isToday(year, month, day);
      const isAvailable = isDateAvailable(day);
      const isSelected = selectedDay === day;

      let dayStyle: any = styles.dayText;
      let dayContainerStyle: any = styles.dayCell;

      if (isTodayDate) {
        dayStyle = [styles.dayText, styles.todayText];
        dayContainerStyle = [styles.dayCell, styles.todayCell];
      } else if (isSelected) {
        dayStyle = [styles.dayText, styles.selectedText];
        dayContainerStyle = [styles.dayCell, styles.selectedCell];
      } else if (isAvailable) {
        dayStyle = [styles.dayText, styles.availableText];
      } else {
        dayStyle = [styles.dayText, styles.unavailableText];
      }

      days.push(
        <TouchableOpacity
          key={day}
          testID={`day-${day}`}
          accessibilityLabel={`Dia ${day}`}
          accessibilityHint={isAvailable ? 'Selecionar dia para visita' : 'Dia indisponível'}
          accessibilityRole="button"
          style={[
            dayContainerStyle,
            !isAvailable && !isTodayDate && !isSelected && styles.dayCellDisabled,
          ]}
          onPress={() => isAvailable && handleDayPress(day)}
          disabled={!isAvailable && !isTodayDate}
          activeOpacity={0.7}
        >
          <Text style={dayStyle}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const formatSelectedDate = () => {
    if (!selectedDay) return null;
    const date = new Date(year, month, selectedDay);
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.terra} />
          <Text style={styles.loadingText}>A carregar dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Propriedade não encontrada'}</Text>
          <TouchableOpacity
            testID="retry-button"
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const agentName = agentProfile?.full_name || 'Agente Imobiliário';
  const agentInitials = agentProfile?.full_name
    ? agentProfile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AI';

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }, isWeb && styles.containerWeb]}>
      {/* HEADER */}
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <TouchableOpacity
          testID="back-button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={[styles.headerTitle, isWeb && styles.headerTitleWeb]}>
          <Text style={styles.headerTitleText}>Agendar Visita</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{property.title}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isWeb ? styles.scrollContentWeb : undefined}
      >
        {/* CALENDAR */}
        <View style={styles.calendarSection}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              testID="prev-month-button"
              accessibilityLabel="Mês anterior"
              accessibilityHint="Ver mês anterior"
              accessibilityRole="button"
              onPress={handlePrevMonth}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity
              testID="next-month-button"
              accessibilityLabel="Próximo mês"
              accessibilityHint="Ver próximo mês"
              accessibilityRole="button"
              onPress={handleNextMonth}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonText}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Week Days */}
          <View style={styles.weekDays}>
            {WEEK_DAYS.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
        </View>

        {/* TIME SLOTS */}
        <View style={styles.slotsSection}>
          <Text style={styles.slotsTitle}>Horários disponíveis</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot, index) => {
              const isSelected = selectedSlot === slot.time;
              const isAvailable = slot.available;

              let slotStyle: any = styles.timeSlot;
              let textStyle: any = styles.timeSlotText;

              if (!isAvailable) {
                slotStyle = [styles.timeSlot, styles.timeSlotDisabled];
                textStyle = [styles.timeSlotText, styles.timeSlotTextDisabled];
              } else if (isSelected) {
                slotStyle = [styles.timeSlot, styles.timeSlotSelected];
                textStyle = [styles.timeSlotText, styles.timeSlotTextSelected];
              }

              return (
                <TouchableOpacity
                  key={index}
                  testID={`time-slot-${slot.time}`}
                  accessibilityLabel={`Horário ${slot.time}`}
                  accessibilityHint={isAvailable ? 'Selecionar horário' : 'Horário indisponível'}
                  accessibilityRole="button"
                  style={[slotStyle, !isAvailable && styles.timeSlotOpacity]}
                  onPress={() => isAvailable && handleSlotPress(slot.time)}
                  disabled={!isAvailable}
                  activeOpacity={0.8}
                >
                  <Text style={textStyle}>{slot.time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CONFIRMATION */}
        <View style={styles.confirmationSection}>
          <View style={styles.confirmationCard}>
            <View style={styles.agentAvatar}>
              <Text style={styles.agentAvatarText}>{agentInitials}</Text>
            </View>
            <View style={styles.confirmationInfo}>
              <Text style={styles.confirmationTitle}>Visita com {agentName}</Text>
              <Text style={styles.confirmationDate}>
                {selectedDay
                  ? `${formatSelectedDate()} às ${selectedSlot || '--:--'}`
                  : 'Selecione dia e hora'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            testID="confirm-booking-button"
            accessibilityLabel="Confirmar agendamento"
            accessibilityHint="Confirma a visita no dia e hora selecionados"
            accessibilityRole="button"
            style={[
              styles.confirmButton,
              (!selectedDay || !selectedSlot || isLoadingConfirm) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedDay || !selectedSlot || isLoadingConfirm}
            activeOpacity={0.9}
          >
            {isLoadingConfirm ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>
                Confirmar Agendamento →
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.mid,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error || '#e53935',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.terra,
    borderRadius: borderRadius.md,
  },

  retryButtonText: {
    fontSize: typography.sizes.md,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },

  // HEADER
  header: {
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    fontWeight: typography.weights.medium,
  },

  // CALENDAR SECTION
  calendarSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    margin: spacing.lg,
    ...shadows.sm,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    color: colors.charcoal,
    fontWeight: typography.weights.semibold,
  },
  monthYear: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    fontFamily: typography.fontDisplay,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekDayText: {
    width: 28,
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: colors.mid,
    fontWeight: typography.weights.semibold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    margin: 2,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.terra,
  },
  selectedCell: {
    backgroundColor: colors.terra,
  },
  dayText: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
  },
  availableText: {
    color: colors.charcoal,
    fontWeight: typography.weights.medium,
  },
  unavailableText: {
    color: colors.lightMid,
  },
  todayText: {
    color: colors.terra,
    fontWeight: typography.weights.semibold,
  },
  selectedText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },

  // TIME SLOTS SECTION
  slotsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  slotsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    width: '31%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  timeSlotSelected: {
    backgroundColor: 'rgba(196, 98, 45, 0.08)',
    borderColor: colors.terra,
    borderWidth: 1,
  },
  timeSlotDisabled: {
    opacity: 0.35,
  },
  timeSlotOpacity: {
    opacity: 0.35,
  },
  timeSlotText: {
    fontSize: typography.sizes.sm,
    color: colors.charcoal,
    fontWeight: typography.weights.medium,
  },
  timeSlotTextSelected: {
    color: colors.terra,
    fontWeight: typography.weights.semibold,
  },
  timeSlotTextDisabled: {
    color: colors.lightMid,
  },

  // CONFIRMATION SECTION
  confirmationSection: {
    paddingHorizontal: spacing.lg,
  },
  confirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.terra,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  agentAvatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  confirmationInfo: {
    flex: 1,
  },
  confirmationTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  confirmationDate: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
  },
  confirmButton: {
    backgroundColor: colors.terra,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.lightMid,
  },
  confirmButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // WEB RESPONSIVE STYLES
  containerWeb: {
    maxWidth: getContainerMaxWidth(),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  headerWeb: {
    paddingHorizontal: spacing.lg,
  },
  headerTitleWeb: {
    marginLeft: spacing.md,
  },
  scrollContentWeb: {
    paddingHorizontal: spacing.lg,
  },
});
