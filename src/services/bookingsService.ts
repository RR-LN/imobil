import { supabase } from './supabase';
import { Booking, BookingWithDetails, CreateBookingData, UpdateBookingData, BookingStatus } from '../types';

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: CreateBookingData) => {
  try {
    // Check if the time slot is available
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('property_id', bookingData.property_id)
      .eq('agent_id', bookingData.agent_id)
      .eq('visit_date', bookingData.visit_date)
      .eq('visit_time', bookingData.visit_time)
      .eq('status', 'confirmed');

    if (checkError) throw checkError;

    if (existingBookings && existingBookings.length > 0) {
      return { booking: null, error: new Error('Este horário já está reservado') };
    }

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        property_id: bookingData.property_id,
        buyer_id: bookingData.buyer_id,
        agent_id: bookingData.agent_id,
        visit_date: bookingData.visit_date,
        visit_time: bookingData.visit_time,
        status: 'pending',
        notes: bookingData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { booking: data as Booking, error: null };
  } catch (error: any) {
    console.error('Create booking error:', error);
    return { booking: null, error };
  }
};

/**
 * Get booking by ID
 */
export const getBooking = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties (*),
        buyer:profiles!buyer_id (*),
        agent:profiles!agent_id (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    return { booking: data as BookingWithDetails, error: null };
  } catch (error: any) {
    console.error('Get booking error:', error);
    return { booking: null, error };
  }
};

/**
 * Get bookings by buyer ID
 */
export const getBuyerBookings = async (buyerId: string, status?: BookingStatus) => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties (*),
        agent:profiles!agent_id (*)
      `)
      .eq('buyer_id', buyerId)
      .order('visit_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { bookings: data as BookingWithDetails[], error: null };
  } catch (error: any) {
    console.error('Get buyer bookings error:', error);
    return { bookings: [], error };
  }
};

/**
 * Get bookings by agent ID
 */
export const getAgentBookings = async (agentId: string, status?: BookingStatus) => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties (*),
        buyer:profiles!buyer_id (*)
      `)
      .eq('agent_id', agentId)
      .order('visit_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { bookings: data as BookingWithDetails[], error: null };
  } catch (error: any) {
    console.error('Get agent bookings error:', error);
    return { bookings: [], error };
  }
};

/**
 * Get bookings by property ID
 */
export const getPropertyBookings = async (propertyId: string, status?: BookingStatus) => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        buyer:profiles!buyer_id (*),
        agent:profiles!agent_id (*)
      `)
      .eq('property_id', propertyId)
      .order('visit_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { bookings: data as BookingWithDetails[], error: null };
  } catch (error: any) {
    console.error('Get property bookings error:', error);
    return { bookings: [], error };
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId: string, status: BookingStatus, cancellationReason?: string) => {
  try {
    const updateData: UpdateBookingData = { status };

    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    return { booking: data as Booking, error: null };
  } catch (error: any) {
    console.error('Update booking status error:', error);
    return { booking: null, error };
  }
};

/**
 * Update booking notes
 */
export const updateBookingNotes = async (bookingId: string, notes: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ notes })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    return { booking: data as Booking, error: null };
  } catch (error: any) {
    console.error('Update booking notes error:', error);
    return { booking: null, error };
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string, reason?: string) => {
  return updateBookingStatus(bookingId, 'cancelled', reason);
};

/**
 * Confirm a booking
 */
export const confirmBooking = async (bookingId: string) => {
  return updateBookingStatus(bookingId, 'confirmed');
};

/**
 * Complete a booking
 */
export const completeBooking = async (bookingId: string) => {
  return updateBookingStatus(bookingId, 'completed');
};

/**
 * Delete a booking (admin only, or within time constraints)
 */
export const deleteBooking = async (bookingId: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Delete booking error:', error);
    return { error };
  }
};

/**
 * Get booking statistics for an agent
 */
export const getAgentStats = async (agentId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('status')
      .eq('agent_id', agentId);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(b => b.status === 'pending').length,
      confirmed: data.filter(b => b.status === 'confirmed').length,
      completed: data.filter(b => b.status === 'completed').length,
      cancelled: data.filter(b => b.status === 'cancelled').length,
    };

    return { stats, error: null };
  } catch (error: any) {
    console.error('Get agent stats error:', error);
    return { stats: null, error };
  }
};
