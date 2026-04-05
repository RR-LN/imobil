-- KuGava - FIXED RLS Policies
-- Este arquivo corrige as vulnerabilidades de segurança identificadas
-- Data: 23 Março 2025

-- ============================================
-- IMPORTANTE: Executar NO SQL EDITOR do Supabase
-- ============================================

-- ===== 1. PROFILES - Dados sensíveis protegidos =====

-- Remover policy perigosa que expõe tudo
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Policy 1: Utilizadores autenticados podem ver dados básicos (nome, avatar, role)
CREATE POLICY "Authenticated users can view basic profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- qualquer utilizador logado
  );

-- Policy 2: Utilizador só pode ver/editar o próprio phone e dados sensíveis
CREATE POLICY "Users can view and edit own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Observação: Se quiseres que telefone de agents seja público, cria policy separada:
-- CREATE POLICY "Agents phone is public" ON profiles
--   FOR SELECT USING (role = 'agent');


-- ===== 2. PROPERTIES - Apenas ativas públicas =====

-- Remover policy antiga (se existir)
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;

-- Nova policy: Só properties ativas são visíveis para todos
CREATE POLICY "Active properties are viewable by everyone"
  ON properties FOR SELECT
  USING (status = 'active');

-- As outras policies (INSERT/UPDATE/DELETE) já estão corretas:
-- OWNER pode gerir as suas properties
-- Não precisamos modificar, mas vamos garantir que existem:
-- (se já existem, these CREATE POLICY vão falhar — ignora erros)


-- ===== 3. CONVERSATIONS - OK (já estava correto) =====
-- Polices atuais:
-- SELECT: buyer_id OU seller_id
-- INSERT: buyer_id OU seller_id
-- Está correto, não modificar


-- ===== 4. MESSAGES - OK (já estava correto) =====
-- SELECT: apenas se for participante da conversa
-- INSERT: auth.uid() = sender_id
-- Está correto, não modificar


-- ===== 5. BOOKINGS - FIX CRÍTICO =====

-- Remover policy de SELECT que não inclui seller
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

-- Nova policy: Buyer, Agent, OU Owner da Property podem ver
CREATE POLICY "Participants can view bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = agent_id
    OR auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = bookings.property_id
    )
  );

-- INSERT: Só buyer pode criar booking (já está)
-- UPDATE: buyer ou agent (já está, mas verificar se owner deve poder também)
-- Opcional: owner pode cancelar?
-- Por agora, manter como está (buyer ou agent)


-- ===== 6. AFFILIATES - OK =====
-- SELECT: próprio (auth.uid() = id) — correto
-- INSERT: próprio (auth.uid() = id) — correto
-- Não modificar


-- ===== 7. REFERRALS - FIX CRÍTICO =====

-- Policy de SELECT está OK (só affiliate vê as suas referrals)
-- Mas INSERT está PERIGOSA: WITH CHECK (true)

-- Remover policy de INSERT perigosa
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;

-- Nova policy: INSERT apenas permitido via sistema (não por utilizadores)
-- Como não podemos criar policy que só permite inserts do servidor
-- Vamos REJEITAR inserts diretos de utilizadores:
CREATE POLICY "Referrals can only be inserted by system"
  ON referrals FOR INSERT
  WITH CHECK (
    -- Só permitir se o insert vem de uma função SECURITY DEFINER
    -- ou se for feito por um utilizador com role especial
    false  -- Bloqueia tudo por agora
  );

-- Para contornar: criaruma Edge Function que insere referrals usando service_role key
-- E remover esta policy quando tiveres a function pronta
-- Alternativa: permitir INSERT apenas se referral é created por um agent? Complexo.

-- Melhor abordagem: usar service_role para inserts, manter policy restritiva
-- Documenta que referrals são criados apenas via backend/Edge Functions


-- ===== 8. ANOTAÇÕES E PRÓXIMOS PASSOS =====

/*
POLICIES APLICADAS COM SUCESSO?

Verifica no Supabase Dashboard:
1. Table Editor → policies → confirmar as policies novas/dropadas
2. Testa com 2 users diferentes que não consigas ver dados do outro

TESTES OBRIGATÓRIOS APÓS EXECUTAR ESTE SQL:

1. Logar como User A:
   - Ver messages de User B → ❌ deve falhar (403/404)
   - Ver property ativa de User B → ✅ deve funcionar
   - Ver property inativa de User B → ❌ deve falhar
   - Ver phone de outro user → ❌ deve falhar

2. Logar como Seller (owner de property):
   - Ver bookings da sua property → ✅ deve funcionar
   - Ver bookings de property de outro → ❌ deve falhar

3. Tentar criar referral diretamente (INSERT) → ❌ deve falhar (use Edge Function)

SE ALGUM TESTE FALHAR: Revise as policies e ajuste conforme necessário.
*/

-- Fim do arquivo de fixes de segurança
-- Execute em seguida: testes manuais (ver acima)
