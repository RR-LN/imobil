# 🚀 KuGava - Configuração do Supabase

Este guia resume todos os passos para configurar o Supabase no projeto KuGava.

## ✅ Ficheiros Criados

### Serviços (`src/services/`)
- [x] `supabase.ts` - Cliente Supabase e tipos
- [x] `authService.ts` - Autenticação (signUp, signIn, signOut, etc.)
- [x] `propertiesService.ts` - Gestão de propriedades
- [x] `chatService.ts` - Mensagens e conversas (com real-time)
- [x] `bookingService.ts` - Marcações de visitas
- [x] `affiliateService.ts` - Programa de afiliados
- [x] `README.md` - Documentação completa

### Schema e Configuração
- [x] `supabase-schema.sql` - Schema completo da base de dados
- [x] `.env.example` - Exemplo de variáveis de ambiente
- [x] `.gitignore` - Atualizado para ignorar `.env`

---

## 📋 Passos de Configuração

### 1. Instalar Dependências

```bash
cd /home/lieven/deving/kugava-app
npm install @supabase/supabase-js react-native-url-polyfill
npm install --save-dev @types/react-native-url-polyfill
```

### 2. Criar Projeto no Supabase

1. Aceda a [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: `kugava`
   - **Database Password**: `<guardar esta password!>`
   - **Region**: `South Africa (Cape Town)` (mais próximo de Moçambique)
5. Aguarde a criação do projeto (~2 minutos)

### 3. Obter Credenciais

No Dashboard do Supabase:
1. Vá para **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Configurar Variáveis de Ambiente

```bash
# Copiar ficheiro de exemplo
cp .env.example .env

# Editar .env (preencher com as credenciais)
nano .env
```

Preencher:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_APP_NAME=KuGava
EXPO_PUBLIC_APP_SCHEME=kugava
EXPO_PUBLIC_ENABLE_AFFILIATES=true
EXPO_PUBLIC_ENABLE_BOOKINGS=true
```

### 5. Executar Schema SQL

1. No Dashboard do Supabase, vá para **SQL Editor** (menu lateral)
2. Clique em **"New Query"**
3. Abra o ficheiro `supabase-schema.sql` e copie todo o conteúdo
4. Cole no editor SQL
5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Confirme que aparece "Success. No rows returned"

**Opcional**: Verificar tabelas criadas:
- Vá para **Table Editor** (menu lateral)
- Deve ver 7 tabelas: `profiles`, `properties`, `conversations`, `messages`, `bookings`, `affiliates`, `referrals`

### 6. Criar Storage Buckets

No Dashboard do Supabase:
1. Vá para **Storage** (menu lateral)
2. Clique em **"New Bucket"**
3. Crie os seguintes buckets:

| Nome | Visibilidade |
|------|-------------|
| `property-images` | Público |
| `avatars` | Público |

**Ou via SQL** (no SQL Editor):
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true);
```

### 7. Configurar Redirect URLs (Opcional)

Para reset de password e email confirmation:

1. Vá para **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque: `kugava://`
3. Em **Redirect URLs**, adicione:
   - `kugava://reset-password`
   - `kugava://confirm-email`

### 8. Testar a Configuração

Crie um ficheiro de teste `test-supabase.ts`:

```typescript
import { supabase } from './src/services/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const { data, error } = await supabase.from('properties').select('count');
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Connection successful!');
  }
}

testConnection();
```

---

## 📊 Estrutura da Base de Dados

```
┌─────────────────┐
│   auth.users    │ (gerido pelo Supabase Auth)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    profiles     │
│ - id (PK)       │
│ - full_name     │
│ - avatar_url    │
│ - role          │
│ - phone         │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│properties│ │conversations│ │ bookings │ │ affiliates│
└────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │          │            │            │
     │          ↓            │            ↓
     │      ┌──────────┐     │        ┌──────────┐
     │      │ messages │     │        │ referrals│
     │      └──────────┘     │        └──────────┘
     │                       │
     └───────────────────────┘
```

---

## 🔐 Segurança (RLS)

Todas as tabelas têm **Row Level Security** ativado:

| Tabela | Política |
|--------|----------|
| `profiles` | Utilizadores veem todos, editam apenas o seu |
| `properties` | Todos veem, apenas dono edita/elimina |
| `conversations` | Apenas participantes veem |
| `messages` | Apenas participantes da conversa veem |
| `bookings` | Apenas buyer e agent veem |
| `affiliates` | Apenas o próprio afiliado vê |
| `referrals` | Apenas o afiliado vê os seus |

---

## 🧪 Testar Serviços

### Testar Autenticação
```typescript
import { signUp, signIn } from './src/services/authService';

const { user, error } = await signUp(
  'teste@kugava.mz',
  'Password123!',
  'João Teste',
  'buyer',
  '+258841234567'
);
```

### Testar Propriedades
```typescript
import { getProperties } from './src/services/propertiesService';

const { properties } = await getProperties({
  city: 'Maputo',
  type: 'house',
});
```

### Testar Chat
```typescript
import { sendMessage } from './src/services/chatService';

const { message } = await sendMessage(
  conversationId,
  userId,
  'Olá! Tenho interesse na propriedade.',
  'text'
);
```

---

## 🛠️ Troubleshooting

### "Missing Supabase environment variables"
- Verifique se `.env` existe na raiz do projeto
- Confirme que as variáveis estão preenchidas
- Reinicie o servidor: `npm start`

### "relation does not exist"
- Execute o schema SQL no Supabase Dashboard
- Verifique se está na base de dados correta

### "permission denied for table"
- Verifique se o utilizador está autenticado
- Confirme que as políticas RLS estão ativas

### "Invalid API key"
- Verifique se a chave `anon` está correta
- Confirme que o projeto está ativo em supabase.com

---

## 📚 Próximos Passos

1. ✅ Executar schema SQL no Supabase
2. ✅ Criar storage buckets
3. ✅ Configurar variáveis de ambiente
4. ✅ Testar autenticação
5. ⬜ Implementar ecrãs com dados reais
6. ⬜ Configurar email templates (opcional)
7. ⬜ Setup de triggers para notificações (opcional)

---

## 📞 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

---

**Projeto**: KuGava  
**Data**: 2026-03-22  
**Status**: ✅ Configuração concluída
