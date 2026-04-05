-- KuGava Supabase Schema
-- Execute this in Supabase SQL Editor or Dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'agent', 'affiliate');
CREATE TYPE property_type AS ENUM ('house', 'land', 'apartment');
CREATE TYPE transaction_type AS ENUM ('sale', 'rent');
CREATE TYPE property_status AS ENUM ('active', 'inactive', 'sold', 'rented');
CREATE TYPE message_type AS ENUM ('text', 'booking', 'image');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE affiliate_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- ============================================
-- TABLES
-- ============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('buyer', 'seller', 'agent', 'affiliate'))
);

-- 2. Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type property_type NOT NULL,
  transaction transaction_type NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MZN',
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  area_m2 NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking INTEGER,
  images TEXT[],
  status property_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_type CHECK (type IN ('house', 'land', 'apartment')),
  CONSTRAINT valid_transaction CHECK (transaction IN ('sale', 'rent')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'sold', 'rented')),
  CONSTRAINT valid_currency CHECK (currency IN ('MZN', 'USD', 'ZAR'))
);

-- 3. Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_conversation UNIQUE (property_id, buyer_id, seller_id)
);

-- 4. Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type message_type NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_message_type CHECK (type IN ('text', 'booking', 'image'))
);

-- 5. Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_booking_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- 6. Affiliates table
CREATE TABLE affiliates (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  level affiliate_level NOT NULL DEFAULT 'bronze',
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_level CHECK (level IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- 7. Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  status referral_status NOT NULL DEFAULT 'pending',
  commission_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_referral_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_transaction ON properties(transaction);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

CREATE INDEX idx_conversations_property ON conversations(property_id);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX idx_bookings_agent ON bookings(agent_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_affiliates_level ON affiliates(level);

CREATE INDEX idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX idx_referrals_user ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update affiliate earnings
CREATE OR REPLACE FUNCTION update_affiliate_earnings(
  affiliate_id UUID,
  amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliates
  SET total_earnings = total_earnings + amount
  WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.buyer_id = user_id OR c.seller_id = user_id)
    AND m.sender_id != user_id
    AND m.created_at > COALESCE(
      (SELECT last_read_at FROM conversation_read WHERE conversation_id = c.id AND user_id = user_id),
      '1970-01-01'::TIMESTAMPTZ
    );
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'REF' || UPPER(SUBSTRING(user_id::TEXT, 1, 8)) || UPPER(SUBSTRING(md5(random()::TEXT), 1, 6));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update affiliate level on earnings change
CREATE OR REPLACE FUNCTION update_affiliate_level_trigger()
RETURNS TRIGGER AS $$
DECLARE
  new_level affiliate_level;
  completed_count INTEGER;
BEGIN
  -- Count completed referrals
  SELECT COUNT(*) INTO completed_count
  FROM referrals
  WHERE affiliate_id = NEW.id AND status = 'completed';
  
  -- Determine new level
  IF NEW.total_earnings >= 100000 OR completed_count >= 20 THEN
    new_level := 'platinum';
  ELSIF NEW.total_earnings >= 50000 OR completed_count >= 10 THEN
    new_level := 'gold';
  ELSIF NEW.total_earnings >= 10000 OR completed_count >= 5 THEN
    new_level := 'silver';
  ELSE
    new_level := 'bronze';
  END IF;
  
  -- Update level if changed
  IF NEW.level != new_level THEN
    UPDATE affiliates SET level = new_level WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = agent_id);

CREATE POLICY "Users can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = agent_id);

-- Affiliates policies
CREATE POLICY "Users can view own affiliate data"
  ON affiliates FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own affiliate record"
  ON affiliates FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Referrals policies
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = affiliate_id);

CREATE POLICY "Users can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (true); -- Allow insertion by system

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets (execute via Supabase Dashboard or API)
-- Example:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE properties IS 'Real estate properties listing';
COMMENT ON TABLE conversations IS 'Chat conversations between buyers and sellers';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON TABLE bookings IS 'Property visit bookings';
COMMENT ON TABLE affiliates IS 'Affiliate program participants';
COMMENT ON TABLE referrals IS 'Referral tracking for affiliates';

-- ============================================
-- MIGRATIONS
-- ============================================

-- Add is_featured column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for featured properties
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured) WHERE is_featured = true;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample properties for testing
/*
-- First, ensure you have a user profile
-- INSERT INTO profiles (id, full_name, role) VALUES ('your-user-uuid', 'Test User', 'seller');

-- Sample featured property
INSERT INTO properties (owner_id, title, description, type, transaction, price, currency, location, city, area_m2, bedrooms, bathrooms, parking, images, status, is_featured)
VALUES (
  'your-user-uuid',
  'Casa de 3 quartos com jardim',
  'Linda casa com area verde, piscina e area de churrasco. Acabamentos de alta qualidade.',
  'house',
  'sale',
  45000000,
  'MZN',
  'Polana Cimento',
  'Maputo',
  350,
  3,
  2,
  2,
  ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  'active',
  true
);

-- Sample regular property
INSERT INTO properties (owner_id, title, description, type, transaction, price, currency, location, city, area_m2, bedrooms, bathrooms, images, status)
VALUES (
  'your-user-uuid',
  'Apartamento T2 no centro',
  'Apartamento moderno com acabamentos novos, perto de todas as comodidades.',
  'apartment',
  'sale',
  18500000,
  'MZN',
  'Baixa',
  'Maputo',
  85,
  2,
  1,
  ARRAY['https://example.com/apt1.jpg'],
  'active'
);
*/
