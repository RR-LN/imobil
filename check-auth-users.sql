-- Verificar users em auth.users (tabela do sistema)

-- 1. Quantos users em auth.users
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_total;

-- 2. Listar users em auth.users (limitado)
SELECT 
    id::text,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    created_at
FROM auth.users
LIMIT 10;

-- 3. Comparar com profiles
SELECT 
    p.id::text as profile_id,
    p.full_name,
    p.is_seller,
    p.is_affiliate
FROM profiles p
LIMIT 10;
