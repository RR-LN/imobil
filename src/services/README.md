# KuGava Services - Supabase Integration

Este módulo contém todos os serviços para integração com o Supabase no projeto KuGava.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Instalação do Schema](#instalação-do-schema)
3. [Serviços Disponíveis](#serviços-disponíveis)
4. [Exemplos de Uso](#exemplos-de-uso)

---

## Configuração Inicial

### 1. Instalar dependências

```bash
npm install @supabase/supabase-js react-native-url-polyfill
```

### 2. Criar projeto no Supabase

1. Aceda a [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: kugava
   - **Database Password**: (guarde esta password!)
   - **Region**: escolha a mais próxima (ex: South Africa - Cape Town)

### 3. Obter credenciais

Após criar o projeto:
1. Vá para **Settings** → **API**
2. Copie:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configurar variáveis de ambiente

```bash
# Copie o ficheiro de exemplo
cp .env.example .env

# Edite o ficheiro .env com as suas credenciais
nano .env
```

Preencha:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Instalação do Schema

### Opção 1: Via Supabase Dashboard (Recomendado)

1. No Dashboard do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie o conteúdo do ficheiro `supabase-schema.sql`
4. Cole no editor e clique em **Run**
5. Confirme que todas as tabelas foram criadas em **Table Editor**

### Opção 2: Via CLI

```bash
# Instale Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Link ao seu projeto
supabase link --project-ref your-project-ref

# Aplique o schema
supabase db push supabase-schema.sql
```

### Criar Storage Buckets

No Supabase Dashboard:
1. Vá para **Storage**
2. Clique em **New Bucket**
3. Crie os buckets:
   - `property-images` (público)
   - `avatars` (público)

Ou via SQL:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true);
```

---

## Serviços Disponíveis

### `supabase.ts`
- Cliente Supabase configurado
- Tipos TypeScript para todas as entidades
- Configuração de persistência de sessão

### `authService.ts`
- `signUp(email, password, fullName, role, phone)` - Criar nova conta
- `signIn(email, password)` - Fazer login
- `signOut()` - Terminar sessão
- `getSession()` - Obter sessão atual
- `getCurrentUser()` - Obter utilizador atual
- `getProfile(userId)` - Obter perfil
- `updateProfile(userId, updates)` - Atualizar perfil
- `onAuthStateChanged(callback)` - Ouvir mudanças de auth
- `resetPassword(email)` - Resetar password

### `propertiesService.ts`
- `getProperties(filters)` - Listar propriedades com filtros
- `getPropertyById(id)` - Obter propriedade por ID
- `createProperty(ownerId, data)` - Criar nova propriedade
- `updateProperty(id, updates)` - Atualizar propriedade
- `deleteProperty(id)` - Eliminar propriedade
- `uploadImage(bucket, file, path)` - Upload de imagem
- `deleteImage(bucket, path)` - Eliminar imagem
- `getPropertiesByUserId(userId)` - Propriedades do utilizador
- `searchProperties(term)` - Pesquisar propriedades

### `chatService.ts`
- `getConversations(userId)` - Listar conversas
- `getConversationById(id)` - Obter conversa por ID
- `getMessages(conversationId, limit)` - Obter mensagens
- `sendMessage(conversationId, senderId, content, type)` - Enviar mensagem
- `subscribeToMessages(conversationId, callback)` - Real-time messages
- `createConversation(propertyId, buyerId, sellerId)` - Criar conversa
- `markAsRead(conversationId, userId)` - Marcar como lida
- `getUnreadCount(userId)` - Contar não lidas
- `deleteMessage(messageId)` - Eliminar mensagem

### `bookingService.ts`
- `createBooking(propertyId, buyerId, agentId, scheduledAt, notes)` - Criar visita
- `getBookings(userId, role)` - Listar visitas
- `getBookingById(id)` - Obter visita por ID
- `updateBookingStatus(id, status, notes)` - Atualizar estado
- `cancelBooking(id, reason)` - Cancelar visita
- `confirmBooking(id)` - Confirmar visita
- `getUpcomingBookings(userId)` - Próximas visitas
- `subscribeToBookings(userId, callback)` - Real-time updates

### `affiliateService.ts`
- `getAffiliateStats(userId)` - Estatísticas do afiliado
- `getReferrals(userId, limit)` - Listar referrals
- `generateReferralLink(userId)` - Gerar link de referral
- `createReferral(affiliateId, userId, propertyId, amount)` - Criar referral
- `updateReferralStatus(id, status, amount)` - Atualizar estado
- `getAffiliateLevel(earnings, count)` - Obter nível
- `updateAffiliateLevel(userId)` - Atualizar nível
- `getReferralLink(code)` - Obter URL do link
- `trackReferralClick(code, userId)` - Track clique

---

## Exemplos de Uso

### Autenticação

```typescript
import { signUp, signIn, signOut } from './services/authService';

// Registar
const { user, error } = await signUp(
  'user@example.com',
  'password123',
  'João Silva',
  'buyer',
  '+258841234567'
);

// Login
const { user, session, error } = await signIn(
  'user@example.com',
  'password123'
);

// Logout
await signOut();
```

### Propriedades

```typescript
import { getProperties, createProperty } from './services/propertiesService';

// Listar propriedades
const { properties, error } = await getProperties({
  type: 'house',
  transaction: 'sale',
  city: 'Maputo',
  maxPrice: 5000000,
});

// Criar propriedade
const { property, error } = await createProperty(userId, {
  title: 'Vivenda T4 com Piscina',
  description: 'Linda vivenda...',
  type: 'house',
  transaction: 'sale',
  price: 4500000,
  currency: 'MZN',
  location: 'Sommerschield',
  city: 'Maputo',
  area_m2: 320,
  bedrooms: 4,
  bathrooms: 3,
  parking: 2,
  images: [],
  status: 'active',
});
```

### Chat

```typescript
import { 
  createConversation, 
  sendMessage, 
  subscribeToMessages 
} from './services/chatService';

// Criar conversa
const { conversation, error } = await createConversation(
  propertyId,
  buyerId,
  sellerId
);

// Enviar mensagem
const { message, error } = await sendMessage(
  conversationId,
  userId,
  'Olá, tenho interesse na propriedade!',
  'text'
);

// Subscrição real-time
const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
  console.log('Nova mensagem:', newMessage);
});

// Remover subscrição
// unsubscribe();
```

### Marcações

```typescript
import { createBooking, getBookings } from './services/bookingService';

// Criar marcação
const { booking, error } = await createBooking(
  propertyId,
  buyerId,
  agentId,
  '2025-03-30T10:00:00Z',
  'Gostaria de visitar a propriedade'
);

// Confirmar marcação
await updateBookingStatus(bookingId, 'confirmed');

// Listar marcações
const { bookings } = await getBookings(userId, 'buyer');
```

### Afiliados

```typescript
import { 
  generateReferralLink, 
  getAffiliateStats,
  getReferralLink 
} from './services/affiliateService';

// Gerar link de referral
const { referralCode } = await generateReferralLink(userId);
const link = getReferralLink(referralCode);

// Obter estatísticas
const { stats, error } = await getAffiliateStats(userId);
console.log(stats);
// {
//   totalReferrals: 14,
//   completedReferrals: 3,
//   conversionRate: 21.4,
//   totalEarnings: 12400,
//   pendingEarnings: 5000,
//   level: 'silver',
//   referralCode: 'REF12345'
// }
```

---

## Estrutura da Base de Dados

```
profiles
├── id (UUID, PK)
├── full_name (TEXT)
├── avatar_url (TEXT)
├── role (user_role)
├── phone (TEXT)
└── created_at (TIMESTAMPTZ)

properties
├── id (UUID, PK)
├── owner_id (UUID, FK → profiles)
├── title (TEXT)
├── description (TEXT)
├── type (property_type)
├── transaction (transaction_type)
├── price (NUMERIC)
├── currency (TEXT)
├── location (TEXT)
├── city (TEXT)
├── area_m2 (NUMERIC)
├── bedrooms (INT)
├── bathrooms (INT)
├── parking (INT)
├── images (TEXT[])
├── status (property_status)
└── created_at (TIMESTAMPTZ)

conversations
├── id (UUID, PK)
├── property_id (UUID, FK → properties)
├── buyer_id (UUID, FK → profiles)
├── seller_id (UUID, FK → profiles)
└── created_at (TIMESTAMPTZ)

messages
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── sender_id (UUID, FK → profiles)
├── content (TEXT)
├── type (message_type)
└── created_at (TIMESTAMPTZ)

bookings
├── id (UUID, PK)
├── property_id (UUID, FK → properties)
├── buyer_id (UUID, FK → profiles)
├── agent_id (UUID, FK → profiles)
├── scheduled_at (TIMESTAMPTZ)
├── status (booking_status)
├── notes (TEXT)
└── created_at (TIMESTAMPTZ)

affiliates
├── id (UUID, PK, FK → profiles)
├── referral_code (TEXT, UNIQUE)
├── referred_by (UUID, FK → profiles)
├── level (affiliate_level)
├── total_earnings (NUMERIC)
└── created_at (TIMESTAMPTZ)

referrals
├── id (UUID, PK)
├── affiliate_id (UUID, FK → affiliates)
├── referred_user_id (UUID, FK → profiles)
├── property_id (UUID, FK → properties)
├── status (referral_status)
├── commission_amount (NUMERIC)
└── created_at (TIMESTAMPTZ)
```

---

## Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** ativado. As políticas garantem:

- **profiles**: Utilizadores só podem atualizar o próprio perfil
- **properties**: Utilizadores podem gerir apenas as suas propriedades
- **conversations**: Utilizadores acedem apenas às suas conversas
- **messages**: Utilizadores acedem apenas a mensagens das suas conversas
- **bookings**: Utilizadores acedem apenas às suas marcações
- **affiliates**: Utilizadores acedem apenas aos seus dados de afiliado
- **referrals**: Utilizadores acedem apenas aos seus referrals

---

## Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o ficheiro `.env` existe e está preenchido
- Reinicie o servidor de desenvolvimento

### Erro: "relation does not exist"
- Execute o schema SQL no Supabase Dashboard
- Verifique se as tabelas foram criadas

### Erro: "permission denied for table"
- Verifique se as políticas RLS estão configuradas
- Confirme que o utilizador está autenticado

### Erro: "Invalid API key"
- Verifique se a chave anon está correta
- Confirme que o projeto está ativo

---

## Links Úteis

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)
