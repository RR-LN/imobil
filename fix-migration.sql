-- Corrigir migração - verificar e garantir estrutura correta

-- 1. Verificar se colunas existem
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Adicionar colunas se não existirem (ignora erro se já existir)
DO $$
BEGIN
    -- Adicionar is_seller
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_seller') THEN
        ALTER TABLE profiles ADD COLUMN is_seller BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Adicionar is_affiliate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_affiliate') THEN
        ALTER TABLE profiles ADD COLUMN is_affiliate BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Remover coluna role se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'role') THEN
        -- Migrar antes de apagar
        UPDATE profiles SET is_seller = true WHERE role IN ('seller', 'agent');
        UPDATE profiles SET is_affiliate = true WHERE role = 'affiliate';
        -- Agora remove
        ALTER TABLE profiles DROP COLUMN role;
    END IF;
END $$;

-- 3. Verificar resultado
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_seller = true) as sellers,
    COUNT(*) FILTER (WHERE is_affiliate = true) as affiliates
FROM profiles;

-- 4. Ver sample
SELECT id, full_name, is_seller, is_affiliate, created_at 
FROM profiles LIMIT 5;
