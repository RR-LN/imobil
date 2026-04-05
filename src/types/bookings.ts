export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  property_id: string;
  buyer_id: string;
  agent_id: string;
  visit_date: string; // ISO date string
  visit_time: string; // HH:mm format
  status: BookingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface BookingWithDetails extends Booking {
  property?: {
    id: string;
    title: string;
    location: string;
    images: string[];
    price: number;
    currency: string;
    type: string;
  };
  buyer?: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
  agent?: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
}

export interface CreateBookingData {
  property_id: string;
  buyer_id: string;
  agent_id: string;
  visit_date: string;
  visit_time: string;
  notes?: string;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  notes?: string;
  cancellation_reason?: string;
}