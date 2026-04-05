-- Diagnóstico: Verificar se há users em auth.users mas não em profiles

-- 1. Quantos users existem em auth.users?
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 2. Verificar se trigger está ativo
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- 3. Se houver users em auth.users mas não em profiles, criar profiles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.raw_user_meta_data 
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO profiles (id, full_name, is_seller, is_affiliate, phone)
        VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'full_name', 'Utilizador'),
            false,
            false,
            user_record.raw_user_meta_data->>'phone'
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- 4. Verificar resultado final
SELECT 
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE is_seller = true) as sellers,
    COUNT(*) FILTER (WHERE is_affiliate = true) as affiliates
FROM profiles;
