import { supabase } from './supabase';

export type DayAvailability = {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  isAvailable: boolean;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // minutes (30, 60)
};

export type AgentSchedule = {
  agentId: string;
  availability: DayAvailability[];
  exceptions: DateException[];
};

export type DateException = {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  reason?: string;
};

export type TimeSlot = {
  time: string; // "09:00"
  available: boolean;
};

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
  { dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
  { dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
  { dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
  { dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
  { dayOfWeek: 6, isAvailable: true, startTime: '09:00', endTime: '13:00', slotDuration: 60 },
  { dayOfWeek: 0, isAvailable: false, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
];

/**
 * Get agent availability for a specific date
 */
export const getAgentAvailabilityForDate = async (
  agentId: string,
  date: string
): Promise<TimeSlot[]> => {
  try {
    // Check for exceptions first
    const { data: exception } = await supabase
      .from('agent_availability_exceptions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', date)
      .single();

    if (exception?.is_blocked) {
      return []; // Fully blocked day
    }

    // Get agent's regular schedule
    const { data: schedule } = await supabase
      .from('agent_schedules')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    const availability = schedule?.availability || DEFAULT_AVAILABILITY;
    const dayOfWeek = new Date(date).getDay();
    const daySchedule = availability.find((d: DayAvailability) => d.dayOfWeek === dayOfWeek);

    if (!daySchedule?.isAvailable) {
      return [];
    }

    // Generate time slots
    const slots = generateTimeSlots(
      daySchedule.startTime,
      daySchedule.endTime,
      daySchedule.slotDuration
    );

    // Check existing bookings
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('visit_time')
      .eq('agent_id', agentId)
      .eq('visit_date', date)
      .eq('status', 'confirmed');

    const bookedTimes = new Set(existingBookings?.map((b) => b.visit_time) || []);

    return slots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.time),
    }));
  } catch (error) {
    console.error('Get agent availability error:', error);
    return [];
  }
};

/**
 * Get available dates for the next 30 days
 */
export const getAvailableDates = async (
  agentId: string,
  daysAhead: number = 30
): Promise<string[]> => {
  const availableDates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const slots = await getAgentAvailabilityForDate(agentId, dateStr);
    if (slots.some((s) => s.available)) {
      availableDates.push(dateStr);
    }
  }

  return availableDates;
};

/**
 * Generate time slots between start and end time
 */
const generateTimeSlots = (
  startTime: string,
  endTime: string,
  duration: number
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(
      currentMinute
    ).padStart(2, '0')}`;
    slots.push({ time: timeStr, available: true });

    currentMinute += duration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
};

/**
 * Set agent availability
 */
export const setAgentAvailability = async (
  agentId: string,
  availability: DayAvailability[]
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase.from('agent_schedules').upsert({
      agent_id: agentId,
      availability,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Set agent availability error:', error);
    return { success: false, error };
  }
};

/**
 * Add date exception (block/unblock specific date)
 */
export const setDateException = async (
  agentId: string,
  date: string,
  isBlocked: boolean,
  reason?: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase.from('agent_availability_exceptions').upsert({
      agent_id: agentId,
      date,
      is_blocked: isBlocked,
      reason,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Set date exception error:', error);
    return { success: false, error };
  }
};
