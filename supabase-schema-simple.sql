-- KuGava Supabase Schema - Simplified Version
-- Sem roles rígidos, qualquer um pode ser comprador, vendedor ou afiliado

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

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

-- 1. Profiles table (extends auth.users) - Sem role rígido
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    -- Flags flexíveis - qualquer um pode ser vendedor, afiliado, etc.
    is_seller BOOLEAN NOT NULL DEFAULT false,
    is_affiliate BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings table (visita ao imóvel)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Quem vai atender
    scheduled_at TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Affiliates table - separado e opcional
CREATE TABLE affiliates (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES profiles(id),
    level affiliate_level NOT NULL DEFAULT 'bronze',
    total_earnings NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Referrals table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id),
    status referral_status NOT NULL DEFAULT 'pending',
    commission_amount NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_seller ON profiles(is_seller) WHERE is_seller = true;
CREATE INDEX idx_profiles_affiliate ON profiles(is_affiliate) WHERE is_affiliate = true;

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_transaction ON properties(transaction);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_featured ON properties(is_featured) WHERE is_featured = true;
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

CREATE INDEX idx_conversations_property ON conversations(property_id);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX idx_bookings_seller ON bookings(seller_id);
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

-- Function to update affiliate level
CREATE OR REPLACE FUNCTION update_affiliate_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level affiliate_level;
    completed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO completed_count
    FROM referrals
    WHERE affiliate_id = NEW.affiliate_id AND status = 'completed';

    SELECT a.total_earnings INTO NEW.total_earnings
    FROM affiliates a
    WHERE a.id = NEW.affiliate_id;

    IF NEW.total_earnings >= 100000 OR completed_count >= 20 THEN
        new_level := 'platinum';
    ELSIF NEW.total_earnings >= 50000 OR completed_count >= 10 THEN
        new_level := 'gold';
    ELSIF NEW.total_earnings >= 10000 OR completed_count >= 5 THEN
        new_level := 'silver';
    ELSE
        new_level := 'bronze';
    END IF;

    UPDATE affiliates SET level = new_level WHERE id = NEW.affiliate_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    code := 'K' || UPPER(SUBSTRING(user_id::TEXT, 1, 6)) || UPPER(SUBSTRING(md5(random()::TEXT), 1, 4));
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
    INSERT INTO profiles (id, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update affiliate level on referral completion
DROP TRIGGER IF EXISTS on_referral_completed ON referrals;
CREATE TRIGGER on_referral_completed
    AFTER UPDATE ON referrals
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_affiliate_level();

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
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Active properties are viewable by everyone"
    ON properties FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can view own properties"
    ON properties FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert properties"
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
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Affiliates policies
CREATE POLICY "Users can view own affiliate data"
    ON affiliates FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own affiliate record"
    ON affiliates FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Referrals policies
CREATE POLICY "Affiliates can view own referrals"
    ON referrals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM affiliates
            WHERE affiliates.id = referrals.affiliate_id
            AND affiliates.id = auth.uid()
        )
    );

CREATE POLICY "Users can view own referred_by"
    ON referrals FOR SELECT
    USING (auth.uid() = referred_user_id);

-- ============================================
-- STORAGE BUCKETS (execute via dashboard ou API)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- ============================================
-- MIGRATION FROM OLD SCHEMA (se necessário)
-- ============================================

-- Para migrar de roles antigos para novo sistema:
-- 1. Adicionar novas colunas
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN DEFAULT false;

-- 2. Converter roles antigos
-- UPDATE profiles SET is_seller = true WHERE role = 'seller' OR role = 'agent';
-- UPDATE profiles SET is_affiliate = true WHERE role = 'affiliate';

-- 3. Depois de confirmar, remover coluna role antiga
-- ALTER TABLE profiles DROP COLUMN IF EXISTS role;
