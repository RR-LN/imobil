import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerBookings,
  getAgentBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  confirmBooking,
  completeBooking,
} from '../services/bookingsService';
import { queryKeys } from './useQuery';
import { BookingStatus } from '../types';

export const useBookings = (userId: string | undefined, role: 'buyer' | 'agent' = 'buyer', status?: BookingStatus) => {
  return useQuery({
    queryKey: queryKeys.bookings.lists({ userId, role, status }),
    queryFn: async () => {
      if (!userId) return [];
      const { bookings, error } = role === 'buyer'
        ? await getBuyerBookings(userId, status)
        : await getAgentBookings(userId, status);
      if (error) throw error;
      return bookings;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useBookingActions = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (params: {
      property_id: string;
      buyer_id: string;
      agent_id: string;
      visit_date: string;
      visit_time: string;
      notes?: string;
    }) => {
      const { booking, error } = await createBooking(params);
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (params: { bookingId: string; status: BookingStatus; reason?: string }) => {
      const { booking, error } = await updateBookingStatus(params.bookingId, params.status, params.reason);
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });

  const cancel = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { booking, error } = await cancelBooking(bookingId, reason);
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });

  const confirm = useMutation({
    mutationFn: async (bookingId: string) => {
      const { booking, error } = await confirmBooking(bookingId);
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });

  const complete = useMutation({
    mutationFn: async (bookingId: string) => {
      const { booking, error } = await completeBooking(bookingId);
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });

  return { create, updateStatus, cancel, confirm, complete };
};
