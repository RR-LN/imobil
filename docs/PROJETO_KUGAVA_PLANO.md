# KuGava - Plano de Robustez e Segurança

**Data:** 23 Março 2025
**Objetivo:** Preparar o app para produção com 500+ usuários (sem orçamento inicial)
**Situação:** Sozinho, sem equipe, focado em robustez antes de timeline

---

## 📋 Índice

1. [Contexto](#contexto)
2. [Análise de Riscos](#análise-de-riscos)
3. [Plano de Ação por Prioridade](#plano-de-ação-por-prioridade)
4. [Checklist de Implementação](#checklist-de-implementação)
5. [Estimativas de Tempo](#estimativas-de-tempo)
6. [Cronograma Recomendado](#cronograma-recomendado)
7. [Testes Obrigatórios](#testes-obrigatórios)
8. [Critérios de "Ready for Launch"](#critérios-de-ready-for-launch)

---

## 🎯 Contexto

**KuGava** é um marketplace imobiliário para Moçambique com sistema de afiliados.

**Infraestrutura atual:** Supabase (plano gratuito)
**Meta:** 500 usuários nos primeiros 3 meses
**Restrições:** Sem orçamento mensal inicial, developer sozinho

**Problema:** A auditoria técnica identifica múltiplas falhas críticas que farão o app:
- Quebrar com poucos usuários (performance)
- Vazar dados (segurança)
- Gastar dados móveis desnecessariamente (UX)
- Falhar silenciosamente (realtime)

**Abordagem:** Focar no **mínimo viável robusto** — não perfeito, mas que não envergonhe nem quebre.

---

## ⚠️ Análise de Riscos (por Categoria)

### 🔴 CRÍTICO - Bloqueante para Lançamento

| Categoria | Problema | Impacto | Timeline de Falha |
|-----------|----------|---------|-------------------|
| Segurança | RLS policies incompletas | Vazamento de dados mensagens/imóveis | Imediato (qualquer usuário) |
| Segurança | Sem validação server-side | Injection, dados corrompidos, spam | Imediato |
| Database | Sem índices | Latência 2-8s, timeout com 1k imóveis | 1-2 semanas |
| Database | Sem paginação | Transferência 15MB, app trava | Imediato |
| Storage | Sem compressão imagens | Storage esgota em dias | 1-2 semanas |
| Storage | Sem thumbnails | Download 4-8MB por card, UX horrível | Imediato |

### 🟡 IMPORTANTE - Afeta Experiência Significativamente

| Categoria | Problema | Impacto | Timeline de Falha |
|-----------|----------|---------|-------------------|
| Realtime | Plano Free 200 conexões | Satura com ~200 usuários simultâneos | 2-3 meses |
| Mobile | FlatList não otimizado | Scroll aos saltos em devices fracos | Imediato |
| Mobile | Imagens sem cache | Recarregam sempre, consome dados | Imediato |
| Mobile | Bundle sem Hermes | Arranque lento (+5-10s) | Imediato |

### 🟢 BOA BASE - Já funciona ou é secundário

- Sistema de afiliados bem pensado
- Zustand para state management
- Bucket properties separado
- UI bem desenhada

---

## 🚀 Plano de Ação por Prioridade

### FASE 1: SEGURANÇA (Semana 1) — NÃO LANCE SEM ISTO

**Objetivo:** Garantir que nenhum usuário aceda dados de outro

#### Tarefa 1.1: Implementar RLS Policies Completas

**Arquivo afetado:** Banco de dados Supabase (SQL)

**Ação:**
Executar as seguintes policies no Supabase SQL Editor:

```sql
-- ===== PROFILES: só o próprio usuário =====
CREATE POLICY "Users see own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- ===== PROPERTIES: owner ou público se active =====
CREATE POLICY "Owners manage own properties" ON properties
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (status = 'active');

-- ===== MESSAGES: só participantes da conversa =====
CREATE POLICY "Conversation participants only" ON messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

-- ===== CONVERSATIONS: só participantes =====
CREATE POLICY "Conversation participants only" ON conversations
  FOR ALL USING (
    auth.uid() IN (buyer_id, seller_id)
  );

-- ===== AFFILIATES: só o próprio =====
CREATE POLICY "Own affiliate data only" ON affiliates
  FOR ALL USING (auth.uid() = user_id);

-- ===== BOOKINGS: comprador ou vendedor =====
CREATE POLICY "Booking participants only" ON bookings
  FOR ALL USING (
    auth.uid() = buyer_id 
    OR auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = bookings.property_id
    )
  );
```

**Teste obrigatório:**
1. Criar dois users (A e B)
2. Logar como A, tentar ler mensagens de B → **DEVE FALHAR**
3. Logar como A, tentar modificar property de B → **DEVE FALHAR**
4. Logar como A, ver property ativa de B (público) → **DEVE FUNCIONAR**

**Tempo estimado:** 2h (implementação) + 2h (testes)

---

#### Tarefa 1.2: Edge Function de Validação

**Arquivo afetado:** `supabase/functions/validate-property/index.ts`

**Ação:**
Criar Edge Function com Zod schema:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod/mod.ts"

const PropertySchema = z.object({
  title: z.string()
    .min(5, "Título muito curto")
    .max(100, "Título muito longo")
    .regex(/^[\w\s\-.,!?àèìòùáéíóúãõç]+$/, "Caracteres inválidos"),
    
  description: z.string()
    .min(20, "Descrição muito curta")
    .max(2000, "Descrição muito longa"),
    
  price: z.number()
    .positive("Preço deve ser positivo")
    .max(1000000000, "Preço fora do limite"),
    
  city: z.string().min(2).max(50),
  property_type: z.enum(['casa', 'terreno', 'apartamento', 'comercial']),
  
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(10),
  area_m2: z.number().positive().max(100000),
  
  // Campos opcionais
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  has_pool: z.boolean().optional(),
  has_garden: z.boolean().optional(),
})

serve(async (req) => {
  try {
    const { data, error: authError } = await req.json()
    
    if (authError || !data) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Dados inválidos" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    const validated = PropertySchema.parse(data)
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: validated 
    }), {
      headers: { "Content-Type": "application/json" }
    })
    
  } catch (e: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: e.errors || e.message 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})
```

**Modificar app:** Chamar esta function antes de insert no banco:

```typescript
async function createProperty(propertyData: any) {
  // 1. Validar
  const validateRes = await fetch(`${SUPABASE_URL}/functions/v1/validate-property`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: propertyData }),
  })
  
  const validateJson = await validateRes.json()
  
  if (!validateJson.success) {
    throw new Error(`Validação falhou: ${JSON.stringify(validateJson.error)}`)
  }
  
  // 2. Insert apenas se válido
  const { data, error } = await supabase
    .from('properties')
    .insert(validateJson.data)
    .select()
    .single()
    
  return { data, error }
}
```

**Teste obrigatório:**
1. Tentar criar property com preço negativo → **DEVE REJEITAR**
2. Tentar com título < 5 chars → **DEVE REJEITAR**
3. Tentar com caracteres especiais maliciosos → **DEVE REJEITAR**
4. Property válido → **DEVE ACEITAR**

**Tempo estimado:** 6h (criação, deploy, integração, testes)

---

#### Tarefa 1.3: Referral Codes no Servidor

**Arquivo afetado:** Banco de dados (trigger) ou Edge Function

**Ação — Opção A (Trigger no banco, mais simples):**

```sql
-- 1. Adicionar coluna se não existir
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- 2. Trigger function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  random_part TEXT;
BEGIN
  -- Gera parte aleatória: 6 caracteres alfanuméricos
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text), 1, 6));
  
  -- Formato: KG + 4 chars user_id + random 6 chars
  NEW.referral_code := 'KG' || 
                       UPPER(SUBSTRING(NEW.user_id::text, 1, 4)) || 
                       random_part;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
DROP TRIGGER IF EXISTS set_referral_code ON affiliates;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON affiliates
  FOR EACH ROW 
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION generate_referral_code();
```

**Ação — Opção B (Edge Function, mais controlada):**
Se quiser ter mais controle (evitar colisões, customizar formato), cria uma function:

```typescript
// supabase/functions/generate-referral/index.ts
serve(async (req) => {
  const { userId } = await req.json()
  
  // Gera código único
  const code = 'KG' + 
               UPPER(SUBSTRING(userId, 1, 4)) + 
               Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // Verifica se já existe (raro, mas possível)
  const { data: exists } = await supabase
    .from('affiliates')
    .select('id')
    .eq('referral_code', code)
    .single()
  
  if (exists) {
    // Recursiva? Não — gera de novo simplesmente
    return generateReferral(userId) // implemente lógica sem loop infinito
  }
  
  return new Response(JSON.stringify({ referral_code: code }))
})
```

**Teste obrigatório:**
1. Criar novo affiliate → referral_code preenchido automaticamente
2. Código tem formato consistente: KGXXXXYYZZZZ
3. Dois affiliates diferentes não geram mesmo código

**Tempo estimado:** 1h (trigger) + 1h (testes)

---

### FASE 2: PERFORMANCE (Semana 2) — UX aceitável

#### Tarefa 2.1: Criar Índices no Banco

**Arquivo afetado:** Supabase SQL Editor

**Ação:**
```sql
-- ===== PROPERTIES =====
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

-- Composite para queries comuns
CREATE INDEX IF NOT EXISTS idx_properties_active_city 
  ON properties(status, city) 
  WHERE status = 'active';

-- ===== MESSAGES =====
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_participants 
  ON messages(sender_id, created_at DESC);

-- ===== CONVERSATIONS =====
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
  ON conversations(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated 
  ON conversations(updated_at DESC);

-- ===== BOOKINGS =====
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(visit_date);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON bookings(buyer_id);

-- ===== PROFILES =====
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

**Verificação:** Executar `EXPLAIN ANALYZE` nas queries mais usadas e confirmar que usa índices.

**Tempo estimado:** 30-60 minutos

---

#### Tarefa 2.2: Implementar Paginação Real

**Arquivos afetados:**
- `services/property.service.ts` (ou onde faz as queries)
- Componentes: `HomeFeed.tsx`, `SearchScreen.tsx`

**Ação — Modificar queries:**

```typescript
// ANTES (carrega TUDO):
const { data } = await supabase
  .from('properties')
  .select('*, profiles!owner_id(full_name, avatar_url)')
  .eq('status', 'active')
  .order('created_at', { ascending: false })

// DEPOIS (paginação):
const PAGE_SIZE = 20

async function fetchProperties(page: number, filters?: any) {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  let query = supabase
    .from('properties')
    .select(`
      id, title, price, city, property_type, bedrooms, bathrooms, area_m2,
      images, latitude, longitude,
      profiles!owner_id(full_name, avatar_url, phone)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)
  
  // Aplicar filtros se existirem
  if (filters?.city) {
    query = query.eq('city', filters.city)
  }
  if (filters?.property_type) {
    query = query.eq('property_type', filters.property_type)
  }
  if (filters?.min_price && filters?.max_price) {
    query = query.gte('price', filters.min_price)
                     .lte('price', filters.max_price)
  }
  
  const { data, error, count } = await query
  
  return { 
    data: data || [], 
    error, 
    count, 
    page,
    hasMore: (count || 0) > to + 1 
  }
}
```

**Ação — Modificar FlatList:**

```typescript
// HomeFeed.tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function HomeFeedScreen() {
  const [filters, setFilters] = useState({})
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['properties', filters],
    queryFn: ({ pageParam = 0 }) => fetchProperties(pageParam, filters),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
  
  const properties = data?.pages.flatMap(p => p.data) || []
  
  return (
    <FlatList
      data={properties}
      renderItem={renderPropertyCard}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={{ margin: 20 }} />
        ) : null
      }
      // ... outras props
    />
  )
}
```

**Tempo estimado:** 3h (backend) + 3h (frontend) + 2h (testes) = 8h

---

#### Tarefa 2.3: Compressão de Imagens no Upload

**Arquivos afetados:**
- Componentes de upload de fotos
- Serviço de upload (property.service.ts ou similar)

**Dependência:** Instalar expo-image-manipulator

```bash
npx expo install expo-image-manipulator
```

**Ação:**

```typescript
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'

async function compressImage(uri: string): Promise<string> {
  try {
    // 1. Obter info da imagem original
    const info = await FileSystem.getInfoAsync(uri)
    if (!info.exists) throw new Error('Arquivo não existe')
    
    // 2. Se já for pequena (< 500KB), não comprimir
    const sizeInKB = (info.size || 0) / 1024
    if (sizeInKB < 500) return uri
    
    // 3. Comprimir
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: 1200, // mantém proporção, altura automática
          },
        },
      ],
      {
        compress: 0.7, // 70% qualidade JPEG
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    )
    
    // 4. Log de redução
    const newInfo = await FileSystem.getInfoAsync(result.uri)
    console.log(`Compressão: ${sizeInKB.toFixed(1)}KB → ${(newInfo.size!/1024).toFixed(1)}KB`)
    
    return result.uri
    
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error)
    return uri // fallback: usa original se falhar
  }
}

// No componente de upload de fotos:
const handleUpload = async (photos: string[]) => {
  const compressedPhotos = []
  
  for (const photo of photos) {
    const compressed = await compressImage(photo)
    compressedPhotos.push(compressed)
  }
  
  // Agora upload com imagens comprimidas
  await uploadPropertyPhotos(compressedPhotos)
}
```

**Teste obrigatório:**
1. Selecionar foto de 5MB → após compressão deve ficar ~300-500KB
2. Fazer upload de 6 fotos → total storage consumido deve ser < 3MB
3. Verificar que qualidade visual ainda é boa na tela

**Tempo estimado:** 4h (implementação + testes)

---

#### Tarefa 2.4: Thumbnails no Feed (Supabase Image Transformations)

**Custo:** Gratuito (incluso no plano Supabase)

**Ação — Criar função utilitária:**

```typescript
// utils/image-utils.ts

/**
 * Gera URL otimizada para thumbnail (feed, listas)
 */
export function getThumbnail(url: string, width = 300, quality = 60): string {
  if (!url) return ''
  
  // Supabase Storage transformations
  // Documentação: https://supabase.com/docs/reference/javascript/storage-upload
  const separator = url.includes('?') ? '&' : '?'
  
  return `${url}${separator}width=${width}&quality=${quality}&resize=cover`
}

/**
 * Gera URL para imagem full (detalhe do imóvel)
 */
export function getFullImage(url: string): string {
  // Sem transformações — usa original
  return url
}

/**
 * Gera URL para avatar pequeno (listas, feeds)
 */
export function getAvatar(url: string): string {
  return getThumbnail(url, 60, 70)
}
```

**Ação — Aplicar em todos os componentes:**

```typescript
// ANTES (PropertyCard.tsx):
<Image 
  source={{ uri: property.images[0] }}
  style={styles.image}
/>

// DEPOIS:
import { getThumbnail } from '../utils/image-utils'

<Image 
  source={{ uri: getThumbnail(property.images[0], 300, 60) }}
  style={styles.image}
/>
```

**Ação — No PropertyDetail (imagem full):**

```typescript
import { getFullImage } from '../utils/image-utils'

<Image 
  source={{ uri: getFullImage(property.images[0]) }}
  style={styles.fullImage}
/>
```

**Verificação:**
1. Abrir feed → Network tab deve mostrar URLs com `?width=300&quality=60`
2. Imagens devem carregar MUITO mais rápido (medir com console.time)
3. Comparar tamanho transferido no Chrome DevTools (antes vs depois)

**Tempo estimado:** 2h (refatoração em todos os components que usam imagem)

---

#### Tarefa 2.5: FlatList Otimizado

**Arquivos afetados:** Todos os screens com FlatList (HomeFeed, SearchResults, MessagesList, etc.)

**Ação — Template para FlatList performático:**

```typescript
const ITEM_HEIGHT = 220 // altura fixa do card (medir no inspector)

<FlatList
  data={properties}
  renderItem={renderPropertyCard}
  keyExtractor={(item) => item.id}
  
  // ==== PERFORMANCE ==== //
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  windowSize={5}  // renderiza 5 telas de conteúdo (não tudo)
  maxToRenderPerBatch={5}  // max por batch
  removeClippedSubviews={true}  // remove da memória o que não está visível
  initialNumToRender={10}  // inicial
  
  // ==== PAGINAÇÃO ==== //
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }}
  onEndReachedThreshold={0.5}
  
  // ==== FEEDBACK ==== //
  ListFooterComponent={
    isFetchingNextPage ? (
      <ActivityIndicator style={{ margin: 20 }} />
    ) : null
  }
  
  // ==== OUTRAS BOAS PRÁTICAS ==== //
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 100 }}
/>
```

**Nota:** Se os cards têm alturas variadas, usa `getItemLayout={null}` e prioriza `windowSize` e `maxToRenderPerBatch`.

**Teste obrigatório:**
1. Abrir app em dispositivo Android fraco (ou emulator com pouca RAM)
2. Scroll rápido — NÃO deve travar ou dar saltos
3. Medir FPS no性能 monitor (deve manter ~60fps)

**Tempo estimado:** 1h por FlatList (provavelmente 3-4 telas) = 4h

---

### FASE 3: CACHE (Semana 3) — Economia de dados

#### Tarefa 3.1: React Query para Cache de API

**Dependência:** Instalar

```bash
npx expo install @tanstack/react-query
```

**Ação — Configurar no App:**

```typescript
// App.tsx ou index.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutos (cache válido)
      cacheTime: 30 * 60 * 1000, // 30 minutos (mantém em cache após desuso)
      retry: 1, // não retry infinito em falhas
      refetchOnWindowFocus: false, // não busca ao voltar ao app
      refetchOnReconnect: true, // busca ao voltar rede
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
      {/* Devtools só em dev */}
      {__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

**Ação — Converter todas as APIs:**

```typescript
// ANTES (componente):
const [properties, setProperties] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  load()
}, [])

async function load() {
  setLoading(true)
  const { data } = await fetchProperties(0)
  setProperties(data)
  setLoading(false)
}

// DEPOIS (com React Query):
import { useInfiniteQuery } from '@tanstack/react-query'

function HomeFeedScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['properties', filters],
    queryFn: ({ pageParam = 0 }) => fetchProperties(pageParam, filters),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
  
  const properties = data?.pages.flatMap(p => p.data) || []
  
  return (
    // FlatList como antes
  )
}
```

**Vantagens automáticas:**
1. Cache automático em memória + disco
2. Dados persistem ao navegar entre telas
3. Voltar ao feed → instantâneo (sem rede se cache fresh)
4. Refetch inteligente (só se stale)
5. Loading states e errors handled

**Teste obrigatório:**
1. Feed carrega (rede ativa)
2. Navegar para detalhe e voltar → **não faz nova request** (ver network tab)
3. Esperar 5+ minutos e voltar → faz nova request (stale)
4. Focar app após 30+ minutos → usa cache (se não expirou)

**Tempo estimado:** 5h (todas as queries da app)

---

#### Tarefa 3.2: Cache de Imagens com expo-image

**Dependência:** Instalar

```bash
npx expo install expo-image
```

**Ação — Substituir todas as ocorrências de `Image` por `expo-image`:**

```typescript
// ANTES (Image nativo):
import { Image } from 'react-native'

<Image 
  source={{ uri: getThumbnail(photo) }}
  style={styles.image}
  resizeMode="cover"
/>

// DEPOIS (expo-image com cache):
import { Image } from 'expo-image'

<Image 
  source={{ uri: getThumbnail(photo) }}
  style={styles.image}
  contentFit="cover"
  transition={200} // fade suave
  placeholder={{ 
    blurhash: 'L6PZfSjE.AyE_3t7t7R**E?b.' // pode gerar em: https://blurha.sh/
  }}
  cachePolicy="memory-disk" // ← KEY: cache em RAM + armazenamento
/>
```

**Blurhash placeholder (opcional mas recomendado):**
Gera hash para imagem e mostra blur durante loading:
- Ferramenta: https://blurha.sh/
- Ou usa função automática (mais lento no client):

```typescript
import { generateBlurhash } from 'expo-image'

// Pode fazer isso server-side no upload e salvar no banco
// ou gerar no client (pós-carga)
```

**Ação — Lazy loading em FlatList:**

expo-image já faz lazy loading automaticamente quando usado em FlatList, mas garante:

```typescript
<FlatList
  // ... outras props
  removeClippedSubviews={true} // já configurado na Tarefa 2.5
/>
```

**Teste obrigatório:**
1. Abrir feed → imagens carregam uma a uma (ou com placeholder)
2. Voltar ao feed → imagens aparecem INSTANTANEAMENTE (do cache)
3. Desligar rede → voltar ao feed → imagens ainda aparecem (cache磁盘)
4. Limpar cache app (Settings → Clear cache) → imagens baixam de novo

**Tempo estimado:** 2-3h (refatoração em todos os componentes)

---

### FASE 4: TESTES (Semana 4) — Validar antes de lançar

---

## ✅ Checklist de Implementação

### Segurança

- [ ] **RLS policies** em TODAS as tabelas testadas
  - [ ] profiles: só o próprio
  - [ ] properties: owner + público se active
  - [ ] messages: só participants
  - [ ] conversations: só participants
  - [ ] affiliates: só o próprio
  - [ ] bookings: buyer ou seller
  
- [ ] **Edge Function validate-property** criada e integrada
  - [ ] Schema Zod com validações
  - [ ] Chamada antes de INSERT/UPDATE
  - [ ] Erros retornados formatados
  
- [ ] **Referral codes** gerados server-side
  - [ ] Trigger ou Edge Function funcionando
  - [ ] Formato consistente KGXXXXYYZZZZ
  - [ ] Sem colisões

### Performance

- [ ] **Índices criados** no Supabase
  - [ ] properties: status, city, type, price, owner, created_at
  - [ ] messages: conversation_id + created_at
  - [ ] conversations: participants, updated_at
  - [ ] bookings: property_id, date, buyer_id
  
- [ ] **Paginação** implementada em todas as listas
  - [ ] HomeFeed com infinite scroll
  - [ ] Search results paginado
  - [ ] Chat history paginado (se aplicável)
  
- [ ] **Compressão de imagens** ativa
  - [ ] expo-image-manipulator instalado
  - [ ] compressão 70% em uploads
  - [ ] resize maxWidth 1200px
  
- [ ] **Thumbnails automáticos** (Supabase transformations)
  - [ ] getThumbnail() implementada
  - [ ] Usada em todos os feeds/cards
  - [ ] Imagem full só em detalhe
  
- [ ] **FlatList otimizado**
  - [ ] getItemLayout implementado (se alturas fixas)
  - [ ] windowSize={5}
  - [ ] maxToRenderPerBatch={5}
  - [ ] removeClippedSubviews={true}
  - [ ] initialNumToRender apropriado

### Cache

- [ ] **React Query** configurado
  - [ ] QueryClientProvider no root
  - [ ] staleTime: 5min
  - [ ] cacheTime: 30min
  - [ ] Todas as APIs usam useQuery/useInfiniteQuery
  
- [ ] **expo-image** com cache
  - [ ] Image substituído em todos os componentes
  - [ ] cachePolicy="memory-disk"
  - [ ] Transição suave (transition=200)
  - [ ] Placeholder opcional

### Outros

- [ ] **Bundle size** — Hermes engine ativado
  - Em app.json ou app.config.js:
  ```json
  {
    "expo": {
      "jsEngine": "hermes"
    }
  }
  ```
  
- [ ] **Offline detection** (mínimo)
  - [ ] NetInfo listener
  - [ ] Banner "Sem internet" quando offline
  
- [ ] **Error boundaries** (pelo menos 1 global)

---

## ⏱️ Estimativas de Tempo

| Tarefa | Complexidade | Estimativa |
|--------|--------------|------------|
| RLS Policies | Média | 2h |
| Edge Function | Alta | 6h |
| Trigger referral codes | Baixa | 1h |
| Criar índices DB | Baixa | 30min |
| Paginação backend | Média | 3h |
| Paginação frontend | Média | 3h |
| Compressão imagens | Média | 4h |
| Thumbnails utils | Baixa | 2h |
| Refatorar FlatLists | Média | 4h |
| React Query setup | Média | 5h |
| expo-image rollout | Baixa-Média | 3h |
| Testes manuais | Alta | 8h |
| Correções pós-teste | Variável | 4h |
| **TOTAL** | | **~46h** |

**Dividido em:**
- 1 mês full-time (40h/semana) → pronto em 1 semana
- 2 meses part-time (20h/semana) → pronto em 2-3 semanas

---

## 📅 Cronograma Recomendado

### Semana 1: Segurança
- Dia 1-2: RLS policies + testes exaustivos
- Dia 3-4: Edge Function validate-property
- Dia 5: Trigger referral codes
- Dia 6: Testes de segurança (tentar burlar)

### Semana 2: Performance Backend
- Dia 1: Criar índices no banco
- Dia 2-3: Paginação no backend (service)
- Dia 4-5: Paginação no frontend (HomeFeed, Search)

### Semana 3: Performance Frontend
- Dia 1-2: Compressão de imagens + upload
- Dia 3: Thumbnails utils + refatoração feed
- Dia 4-5: FlatList otimizado em todas as telas

### Semana 4: Cache + Testes
- Dia 1-2: React Query (todas as queries)
- Dia 3-4: expo-image rollout (substituir todas as imagens)
- Dia 5: Testes manuais completos
- Dia 6: Correções finais

---

## 🧪 Testes Obrigatórios (não pule)

### Teste de Segurança
```
1. Criar user A e user B
2. Logar como A:
   ❌ Tentar ver messages de B → deve bloquear (403/404)
   ❌ Tentar modificar property de B → deve bloquear
   ✅ Ver properties ativas (públicas) → deve funcionar
   ✅ Ver propria profile → deve funcionar
3. Logar como B:
   ❌ Ver messages de A → deve bloquear
   ✅ Ver propria affiliate data → deve funcionar
```

### Teste de Performance
```
1. Criar 50 properties fixtures no banco
2. Abrir feed:
   ✅ Primeira load < 2 segundos
   ✅ Transferência < 500KB (com paginação + thumbnails)
3. Scroll rápido:
   ✅ Sem travar (FPS > 45)
   ✅ Sem memory leak (monitorar com devtools)
4. Upload de foto 5MB:
   ✅ Resultado final < 500KB
```

### Teste de Cache
```
1. Abrir feed com rede → carrega
2. Navegar para detalhe e voltar:
   ✅ Não aparece loading spinner (cache hit)
3. Desligar rede completamente:
   ✅ Feed ainda mostra dados em cache
   ❌ Não quebra app (gracious degradation)
```

### Teste de Storage
```
1. Fazer upload de 6 fotos grandes (5MB cada)
2. Verificar storage usado no Supabase:
   ✅ Deve usar ~1.5-2GB (com compressão), NÃO 30GB
3. Verificar URLs no feed:
   ✅ URLs contêm ?width=300&quality=60
```

---

## 🎯 Critérios de "Ready for Launch"

### MÍNIMO ACEITÁVEL (500 usuários)

**Obrigatório:**
- ✅ RLS policies auditadas e funcionando
- ✅ Validação server-side em todas as writable APIs
- ✅ Paginação em todas as listas
- ✅ Imagens comprimidas (< 500KB cada)
- ✅ Thumbnails no feed
- ✅ FlatList otimizado (scroll suave em device fraco)
- ✅ Cache com React Query (voltar ao feed instantâneo)
- ✅ Cache de imagens (expo-image)

**Desejável (mas não blocker):**
- ⭕ Full-text search (LIKE funciona para < 5k items)
- ⭕ CDN ativado (Supabase storage serve OK para Moçambique)
- ⭕ Offline completo (batch de mensagens)
- ⭕ Analytics (Mixpanel/PostHog)
- ⭕ Sistema de avaliações

### NÃO LANÇAR SEM:

- ❌ RLS incompleta (risco data breach)
- ❌ Sem paginação (app trava com poucos dados)
- ❌ Imagens não comprimidas (storage explode em dias)
- ❌ Cache de imagens (desperdício dados móveis)

---

## 📊 Monitoramento Pós-Launch (grátis)

### O que monitorar (sem custo)

1. **Supabase Dashboard**
   - Database size (não passar 70% de 500MB)
   - Storage usage (não passar 70% de 1GB)
   - API calls/day (não passar limite de 2M free)
   - Realtime connections (não passar 150/200)

2. **React Query Devtools** (development only)
   - Cache hit rate (target > 70%)
   - Query errors

3. **Sentimento do usuário**
   - Feedback via formulário simples (Google Forms free)
   - Monitorar crash reports (Expo free tier)

### When to Upgrade (gatilhos de investimento)

| Gatilho | Ação | Custo |
|---------|------|------|
| Storage > 700MB | Supabase Pro ($25/mês) | $25/mês |
| API calls > 1.5M/dia | Otimiza queries OU Pro | $25/mês |
| Realtime connections > 150 | Supabase Pro ($25/mês) | $25/mês |
| > 1000 usuários ativos/mês | Analytics pago (Mixpanel) | $25-100/mês |

**Regra de ouro:** Paga INFRA quando o problema afeta usuários de forma mensurável (não preemptive).

---

## 🔄 Fluxo de Trabalho Sugerido

```bash
# 1. Setup inicial
cd deving/kugava-app
git checkout -b feature/robustez-v1

# 2. Implementar em ordem (ver checklist)
# Cada tarefa commit separado com mensagem clara:
git add .
git commit -m "feat: implement RLS policies for all tables"

# 3. Testar localmente após cada módulo
# 4. Quando completar Fase 1-3, merge em main
git checkout main
git merge feature/robustez-v1
git tag -a v1.0-robust -m "Ready for pilot with 100 users"
```

---

## 📝 Notas Finais

**Lembre-se:** 
1. Você não precisa de perfeição — precisa de **não quebrar** e **não envergonhar**
2. 500 usuários no plano FREE é **factível** se fizeres estas optimizações
3. Foca no **mínimo viável robusto** — podes melhorar depois com feedback real
4. Segurança NÃO é después — faz primeiro

**Se precisares de ajuda específica em qualquer tarefa, posso detalhar o código passo a passo.**

**Próximo passo sugerido:** Começa pela **Tarefa 1.1 (RLS Policies)** — é a mais crítica e mais rápida (2h). Depois testa exaustivamente antes de avançar.

Boa sorte! O KuGava tem potencial — agora é meter as mãos na massa. 🚀

---

**Documento criado:** 23 Março 2025
**Versão:** 1.0
**Autor:** Hermes Agent + Lieven
