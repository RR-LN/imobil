-- ============================================
-- MIGRAÇÃO: Do schema antigo (roles rígidos) para novo (flags flexíveis)
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar novas colunas (se não existirem)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_seller BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN NOT NULL DEFAULT false;

-- 2. Migrar dados dos roles antigos para novas flags
-- seller e agent viram is_seller=true
UPDATE profiles SET is_seller = true WHERE role IN ('seller', 'agent');
-- affiliate vira is_affiliate=true
UPDATE profiles SET is_affiliate = true WHERE role = 'affiliate';
-- buyer não faz nada (já é false por padrão)

-- 3. Atualizar trigger handle_new_user para NÃO criar role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, is_seller, is_affiliate)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        false,  -- novo user começa como comprador (não vendedor)
        false   -- não é afiliado por padrão
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Remover a constraint que exige role (se existir)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;

-- 5. Opcional: Remover coluna role (só execute se tiver certeza)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- 6. Atualizar índices das novas colunas
CREATE INDEX IF NOT EXISTS idx_profiles_seller ON profiles(is_seller) WHERE is_seller = true;
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate ON profiles(is_affiliate) WHERE is_affiliate = true;

-- ============================================
-- RLS POLICIES - Atualizar permissões
-- ============================================

-- Remover políticas antigas que referenciam role
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Criar novas políticas simplificadas
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver se migração funcionou
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_seller = true) as sellers,
    COUNT(*) FILTER (WHERE is_affiliate = true) as affiliates,
    COUNT(*) FILTER (WHERE is_seller = true AND is_affiliate = true) as both
FROM profiles;
