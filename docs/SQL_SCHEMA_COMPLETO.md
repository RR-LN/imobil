# KuGava - SQL para Copiar e Colar no Supabase SQL Editor

## Instruções

1. Abre o Supabase Dashboard
2. Vai em **SQL Editor** (menu esquerdo)
3. Clica em **"+ New Query"**
4. Copia TODO o código abaixo
5. Cola no editor
6. Clica em **Run** (ou Ctrl+Enter)

---

## Código SQL

```sql
-- ============================================
-- KuGava - SCHEMA COMPLETO + RLS
-- Executar TUDO de uma vez no SQL Editor
-- ============================================

-- Habilitar extensão UUID
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
-- TABELAS
-- ============================================

-- 1. Profiles (extende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'buyer',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('buyer', 'seller', 'agent', 'affiliate'))
);

-- 2. Properties
CREATE TABLE IF NOT EXISTS properties (
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

-- 3. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_conversation UNIQUE (property_id, buyer_id, seller_id)
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type message_type NOT NULL DEFAULT 'text',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_message_type CHECK (type IN ('text', 'booking', 'image'))
);

-- 5. Bookings
CREATE TABLE IF NOT EXISTS bookings (
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

-- 6. Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(id),
    level affiliate_level NOT NULL DEFAULT 'bronze',
    total_earnings NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_level CHECK (level IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- 7. Referrals
CREATE TABLE IF NOT EXISTS referrals (
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
-- ÍNDICES (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_property ON conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Gerar referral code automático
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    random_part TEXT;
BEGIN
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text), 1, 6));
    NEW.referral_code := 'KG' || UPPER(SUBSTRING(NEW.id::text, 1, 4)) || random_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON affiliates;
CREATE TRIGGER set_referral_code
    BEFORE INSERT ON affiliates
    FOR EACH ROW
    WHEN (NEW.referral_code IS NULL)
    EXECUTE FUNCTION generate_referral_code();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
-- Utilizadores autenticados podem ver perfis básicos
CREATE POLICY "Authenticated users can view profiles"
    ON profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Utilizadores só podem atualizar o próprio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - PROPERTIES
-- ============================================
-- Properties ativas são visíveis para todos, inativas só para owner
CREATE POLICY "Active properties are viewable"
    ON properties FOR SELECT
    USING (status = 'active' OR auth.uid() = owner_id);

-- Apenas owner pode inserir suas properties
CREATE POLICY "Users can insert own properties"
    ON properties FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Apenas owner pode atualizar suas properties
CREATE POLICY "Users can update own properties"
    ON properties FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Apenas owner pode deletar suas properties
CREATE POLICY "Users can delete own properties"
    ON properties FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================
-- RLS POLICIES - CONVERSATIONS
-- ============================================
-- Só participantes podem ver conversas
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Só participantes podem criar conversas
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================
-- RLS POLICIES - MESSAGES
-- ============================================
-- Só participantes da conversa podem ver mensagens
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
    );

-- Utilizadores só podem enviar suas próprias mensagens
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- RLS POLICIES - BOOKINGS
-- ============================================
-- Buyer, Agent ou Owner da property podem ver bookings
CREATE POLICY "Users can view relevant bookings"
    ON bookings FOR SELECT
    USING (
        auth.uid() = buyer_id
        OR auth.uid() = agent_id
        OR auth.uid() IN (SELECT owner_id FROM properties WHERE id = bookings.property_id)
    );

-- Buyers podem criar bookings
CREATE POLICY "Buyers can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Participantes podem atualizar bookings
CREATE POLICY "Participants can update bookings"
    ON bookings FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = agent_id)
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = agent_id);

-- ============================================
-- RLS POLICIES - AFFILIATES
-- ============================================
-- Só o próprio utilizador pode ver seus dados de afiliado
CREATE POLICY "Users can view own affiliate data"
    ON affiliates FOR SELECT
    USING (auth.uid() = id);

-- Utilizadores podem criar seu próprio registro de afiliado
CREATE POLICY "Users can create own affiliate record"
    ON affiliates FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - REFERRALS
-- ============================================
-- Só o affiliate pode ver suas referrals
CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = affiliate_id);

-- Nota: Referrals devem ser criados via Edge Function com service_role
-- Não permitimos INSERT direto de utilizadores

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Criar buckets para imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('property-images', 'property-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies - Property Images
CREATE POLICY "Anyone can view property images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own property images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'property-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage Policies - Avatars
CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own avatars"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- PRONTO! Schema criado com sucesso.
-- ============================================
```

---

## Próximo Passo

Depois de executar o SQL acima:

1. Vai em **Table Editor** e confirma que as tabelas foram criadas
2. Vai em **Storage** e confirma que os buckets foram criados
3. Diz-me: **"Executei o SQL, tudo funcionou"**

E continuamos com a criação da Edge Function de validação.

---

## Nota sobre RLS Automático

Como mencionaste que ativaste a opção de RLS automático durante a criação do projeto, o comando `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` pode não ser necessário, mas não faz mal executar — ele apenas confirma que o RLS está ativo. O importante são as **POLICIES** que definem quem pode fazer o quê em cada tabela.
