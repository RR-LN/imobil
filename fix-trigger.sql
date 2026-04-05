-- Atualizar trigger para novo schema (sem coluna role)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, is_seller, is_affiliate)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        false,  -- começa como comprador (não vendedor)
        false   -- não é afiliado por padrão
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
