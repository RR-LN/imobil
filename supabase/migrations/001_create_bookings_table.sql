-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer_id ON bookings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);

-- Unique constraint: prevent double bookings for same property/agent/slot
CREATE UNIQUE INDEX IF NOT EXISTS uniq_booking_slot ON bookings (property_id, agent_id, scheduled_at) WHERE status IN ('pending', 'confirmed');

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies:

-- 1. Buyers can view their own bookings
CREATE POLICY "Buyers can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = buyer_id);

-- 2. Agents can view bookings for their properties
CREATE POLICY "Agents can view bookings for their properties" ON bookings
  FOR SELECT USING (
    auth.uid() = agent_id OR
    auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = property_id
    )
  );

-- 3. Sellers can view bookings for their properties
CREATE POLICY "Sellers can view bookings for their properties" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- 4. Authenticated users can create bookings (app will validate)
CREATE POLICY "Authenticated users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Allow updates by buyer or agent involved
CREATE POLICY "Buyer can update their booking" ON bookings
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Agent can update their booking" ON bookings
  FOR UPDATE USING (auth.uid() = agent_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE
  ON bookings FOR EACH ROW EXECUTE FUNCTION
  update_updated_at_column();

-- Comment
COMMENT ON TABLE bookings IS 'Property visit bookings - connects buyers, agents, and properties';
COMMENT ON COLUMN bookings.scheduled_at IS 'Visit date and time in ISO format';
COMMENT ON COLUMN bookings.status IS 'pending, confirmed, cancelled, completed';
