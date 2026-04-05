-- Trigger to call Edge Function when booking status changes to 'confirmed'

-- First, create a function to call the Edge Function
CREATE OR REPLACE FUNCTION call_process_referral_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Call the Edge Function via pg_net or similar
    -- Note: This requires pg_net extension or supabase integration
    
    -- Insert into a queue table for processing
    INSERT INTO referral_commission_queue (booking_id, buyer_id, property_id, status, created_at)
    VALUES (NEW.id, NEW.buyer_id, NEW.property_id, 'pending', NOW())
    ON CONFLICT DO NOTHING;
    
    -- Alternatively, we can use supabase_realtime to notify
    PERFORM pg_notify('booking_confirmed', json_build_object(
      'booking_id', NEW.id,
      'buyer_id', NEW.buyer_id,
      'property_id', NEW.property_id
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_commission_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  property_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(booking_id)
);

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_process_referral_commission ON bookings;
CREATE TRIGGER trigger_process_referral_commission
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION call_process_referral_commission();

-- Grant permissions
GRANT ALL ON referral_commission_queue TO authenticated;
GRANT ALL ON referral_commission_queue TO service_role;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_referral_commission_queue_status ON referral_commission_queue(status);

-- Comment
COMMENT ON TABLE referral_commission_queue IS 'Queue for processing referral commissions when bookings are confirmed';
COMMENT ON FUNCTION call_process_referral_commission IS 'Trigger function to queue referral commission processing when booking is confirmed';
