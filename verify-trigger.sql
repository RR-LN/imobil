-- Verificar se a função foi atualizada corretamente

-- Ver a definição atual da função
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
