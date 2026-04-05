-- Atualizar trigger SEM precisar remover (CREATE OR REPLACE substitui automaticamente)

-- O trigger está ligado à função, então apenas substituímos a função
-- Não precisa de DROP

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, is_seller, is_affiliate)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        false,
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
