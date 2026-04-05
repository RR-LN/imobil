-- Testar criação completa via SQL (simulando o que o app faz)
-- Criar user em auth.users primeiro, depois dispara o trigger que cria profile

-- Inserir em auth.users (simulação - precisa de senha hasheada)
-- NOTA: Em produção isso é feito pela API de Auth
-- Aqui vamos apenas verificar se a estrutura está OK para quando o app chamar

-- Verificar a estrutura da tabela auth.users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth';

-- Ver se há alguma trigger que ainda referencia 'role' antigo
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
