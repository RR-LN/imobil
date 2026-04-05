# KuGava - Roadmap: 500 Usuários no Plano Gratuito

**Objetivo:** App robusto e seguro sem orçamento inicial
**Desenvolvedor:** Sózinho
**Timeline:** Sem pressa - foco em qualidade

---

## 📋 PASSO A PASSO EXECUTÁVEL

### 📌 COMO USAR ESTE DOCUMENTO

1. Começa pelo **Dia 1** e segue em ordem
2. **NÃO pule passos** — cada um depende do anterior
3. Marca ✅ quando completar
4. Testa após cada passo
5. Se travar, volta e relê a explicação

---

## 🔴 FASE 1: SEGURANÇA (DIAS 1-3) - NÃO LANCE SEM ISTO

### DIA 1: RLS Policies - Bloqueia vazamento de dados

**O que vais fazer:** Garantir que nenhum usuário veja dados de outros

**Passos:**

1. Abre o Supabase Dashboard
2. Vai em **SQL Editor**
3. Copia e cola TODO este código:

```sql
-- ===== 1. PROFILES - Só o próprio usuário =====
CREATE POLICY "Users see own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- ===== 2. PROPERTIES - Owner ou público se active =====
CREATE POLICY "Owners manage own properties" ON properties
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (status = 'active');

-- ===== 3. MESSAGES - Só participantes da conversa =====
CREATE POLICY "Conversation participants only" ON messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

-- ===== 4. CONVERSATIONS - Só participantes =====
CREATE POLICY "Conversation participants only" ON conversations
  FOR ALL USING (
    auth.uid() IN (buyer_id, seller_id)
  );

-- ===== 5. AFFILIATES - Só o próprio =====
CREATE POLICY "Own affiliate data only" ON affiliates
  FOR ALL USING (auth.uid() = user_id);

-- ===== 6. BOOKINGS - Comprador ou vendedor =====
CREATE POLICY "Booking participants only" ON bookings
  FOR ALL USING (
    auth.uid() = buyer_id
    OR auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = bookings.property_id
    )
  );
```

4. Clica em **RUN**
5. Se der erro de "policy already exists", ignora — significa que já tinhas algumas

**Teste AGORA (5 minutos):**

1. Cria 2 contas de teste (User A e User B)
2. Logado como User A:
   - Tenta aceder a URL direta do Supabase Table Editor → mensagens
   - Deve aparecer: "You are not authorized"
3. Logado como User B:
   - Tenta ver property do User A (se for ativa) → DEVE FUNCIONAR
   - Tenta ver mensagens do User A → DEVE BLOQUEAR

✅ Se funcionou, avança para DIA 2

---

### DIA 2: Edge Function - Validação de Dados

**O que vais fazer:** Validar property antes de salvar (evita injection, preços negativos, spam)

**Passos:**

1. No Supabase Dashboard, vai em **Functions**
2. Clica **+ New Function**
3. Nome: `validate-property`
4. Runtime: **TypeScript** (Deno)
5. Copia e cola este código:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod/mod.ts"

// Schema de validação
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
  
  // Opcionais
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  has_pool: z.boolean().optional(),
  has_garden: z.boolean().optional(),
})

serve(async (req) => {
  try {
    const body = await req.json()
    
    if (!body.data) {
      return response(400, { success: false, error: "Dados não fornecidos" })
    }
    
    // Validação
    const validated = PropertySchema.parse(body.data)
    
    return response(200, { success: true, data: validated })
    
  } catch (e: any) {
    // Zod retorna erros estruturados
    const errors = e.errors?.map((err: any) => ({
      field: err.path[0],
      message: err.message
    })) || [{ message: e.message }]
    
    return response(400, { success: false, errors })
  }
})

function response(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}
```

6. Clica **Deploy** (leva 10-30 segundos)
7. Anota a URL da função (vais precisar depois)

**Agora integra no teu app:**

1. Abre o teu código (onde crias properties)
2. Encontra a função que faz `INSERT` na tabela properties
3. Adiciona chamada à Edge Function ANTES do insert:

```typescript
async function createProperty(propertyData: any) {
  // 1. Validar com Edge Function
  const validateRes = await fetch(
    'https://SEU_PROJECT.supabase.co/functions/v1/validate-property',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ data: propertyData }),
    }
  )
  
  const validateJson = await validateRes.json()
  
  if (!validateJson.success) {
    // Mostra erro específico ao utilizador
    const errorMessages = validateJson.errors?.map((e: any) => 
      `${e.field}: ${e.message}`
    ).join(', ') || 'Dados inválidos'
    
    throw new Error(`Validação falhou: ${errorMessages}`)
  }
  
  // 2. Só insere se válido
  const { data, error } = await supabase
    .from('properties')
    .insert(validateJson.data)
    .select()
    .single()
  
  return { data, error }
}
```

**Teste AGORA:**

1. Tenta criar property com preço negativo → deve falhar com mensagem clara
2. Tenta com título de 2 caracteres → deve falhar
3. Tenta com código malicioso no título: `<script>alert('xss')</script>` → deve falhar
4. Tenta com dados válidos → deve suceder

✅ Se funcionou, avança para DIA 3

---

### DIA 3: Referral Codes Server-Side

**O que vais fazer:** Gerar códigos de afiliado no servidor (não no cliente)

**Passos:**

1. No Supabase Dashboard, SQL Editor
2. Cria este trigger:

```sql
-- 1. Adicionar coluna se não existir
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- 2. Função que gera código único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  random_part TEXT;
BEGIN
  -- Gera 6 caracteres aleatórios alfanuméricos
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text), 1, 6));
  
  -- Formato: KG + 4 primeiros chars do user_id + random 6 chars
  NEW.referral_code := 'KG' || 
                       UPPER(SUBSTRING(NEW.user_id::text, 1, 4)) || 
                       random_part;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicar trigger (executa antes de INSERT)
DROP TRIGGER IF EXISTS set_referral_code ON affiliates;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON affiliates
  FOR EACH ROW 
  WHEN (NEW.referral_code IS NULL) -- só gera se não fornecido
  EXECUTE FUNCTION generate_referral_code();
```

3. Clica **RUN**

**Teste AGORA:**

1. No app, cria um novo affiliate (ou diretamente no banco)
2. Verifica a coluna `referral_code`:
   - Deve estar preenchida automaticamente
   - Formato: `KGXXXXYYZZZZ` (KG + 4 letras + 6 caracteres)
3. Cria outro affiliate com user diferente:
   - Código deve ser DIFERENTE (único)

✅ Se funcionou, FASE 1 COMPLETA! Passa para FASE 2

---

## 🟡 FASE 2: PERFORMANCE (DIAS 4-7) - UX não vergonhosa

### DIA 4: Índices no Banco + Paginação Backend

**Passo 4.1: Criar Índices (30 minutos)**

No SQL Editor:

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

-- ===== CONVERSATIONS =====
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
  ON conversations(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated 
  ON conversations(updated_at DESC);

-- ===== BOOKINGS =====
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(visit_date);
```

**Verificação:**
```sql
-- Testa se índices estão sendo usados
EXPLAIN ANALYZE 
SELECT * FROM properties WHERE status = 'active' AND city = 'Maputo';
```
Deve aparecer `Index Scan` e não `Seq Scan`.

---

**Passo 4.2: Paginação no Backend (2-3 horas)**

Localiza o arquivo onde fazes query de properties (ex: `services/property.service.ts` ou `api/properties.ts`).

**Modifica:**

1. Define constante:
```typescript
const PAGE_SIZE = 20
```

2. Refactor função `fetchProperties`:

```typescript
// ANTES (carregava tudo):
async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*, profiles!owner_id(full_name, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// DEPOIS (paginação):
async function fetchProperties(page: number = 0, filters?: { city?: string, type?: string }) {
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
    .range(from, to)  // ← Paginação!
  
  // Filtros
  if (filters?.city) {
    query = query.eq('city', filters.city)
  }
  if (filters?.type) {
    query = query.eq('property_type', filters.type)
  }
  
  const { data, error, count } = await query
  
  return {
    data: data || [],
    error,
    count: count || 0,
    page,
    hasMore: (count || 0) > to + 1
  }
}
```

✅ Testa no banco de dados (com 10+ properties):
- Página 0 → retorna items 0-19
- Página 1 → retorna items 20-39
- hasMore deve ser true se count > 20

---

### DIA 5: Paginação Frontend + FlatList Otimizado

**Passo 5.1: Paginação na HomeFeed**

No componente HomeFeed (ou equivalente):

1. Instala React Query se ainda não tens:
```bash
npx expo install @tanstack/react-query
```

2. Configura QueryClient (em App.tsx):

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache
      cacheTime: 30 * 60 * 1000, // 30 min retention
    },
  },
})

// No componente App:
<QueryClientProvider client={queryClient}>
  <Navigation />
</QueryClientProvider>
```

3. Modifica HomeFeed para usar infinite query:

```typescript
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
  
  // Achata páginas em array único
  const properties = data?.pages.flatMap(page => page.data) || []
  
  return (
    <FlatList
      data={properties}
      renderItem={renderPropertyCard}
      keyExtractor={(item) => item.id}
      
      // Paginação
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      onEndReachedThreshold={0.5}
      
      // Loading indicator
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={{ margin: 20 }} />
        ) : null
      }
      
      // ... outras props (ver DIA 6)
    />
  )
}
```

✅ Testa:
- Scroll até fim → deve carregar mais 20 itens
- Chrome DevTools Network → múltiplas chamadas `/properties?page=0,1,2...`
- Voltar ao topo → não recarrega (cache React Query)

---

**Passo 5.2: Otimizar FlatList (IMPORTANTE!)**

Mede a altura do teu card de property (ex: 220px). Depois:

```typescript
const ITEM_HEIGHT = 220 // altura fixa em pixels

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
  windowSize={5}
  maxToRenderPerBatch={5}
  removeClippedSubviews={true}
  initialNumToRender={10}
  
  // ... paginação props de cima
/>
```

✅ Testa em device Android fraco (ou emulator):
- Scroll rápido deve ser FLUIDO (não aos saltos)
- Não deve ter memory leak (monitora em devtools)

---

### DIA 6: Compressão de Imagens + Thumbnails

**Passo 6.1: Instalar dependências**

```bash
npx expo install expo-image-manipulator
```

**Passo 6.2: Criar função de compressão**

Cria arquivo `utils/image-utils.ts`:

```typescript
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'

/**
 * Comprime imagem antes de upload
 * Reduz de 4-8MB para 200-500KB
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(uri)
    if (!info.exists) throw new Error('Arquivo não existe')
    
    const sizeInKB = (info.size || 0) / 1024
    
    // Se já for pequena (< 500KB), não comprime
    if (sizeInKB < 500) return uri
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: 1200, // altura proporcional automática
          },
        },
      ],
      {
        compress: 0.7, // 70% qualidade JPEG
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    )
    
    const newInfo = await FileSystem.getInfoAsync(result.uri)
    console.log(`📷 Compressão: ${sizeInKB.toFixed(1)}KB → ${(newInfo.size!/1024).toFixed(1)}KB`)
    
    return result.uri
    
  } catch (error) {
    console.error('❌ Erro ao comprimir:', error)
    return uri // fallback: usa original
  }
}

/**
 * Gera URL otimizada para thumbnail (feed, listas)
 * Supabase Storage transformations - GRATUITO
 */
export function getThumbnail(url: string, width = 300, quality = 60): string {
  if (!url) return ''
  
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}width=${width}&quality=${quality}&resize=cover`
}

/**
 * Imagem full (detalhe)
 */
export function getFullImage(url: string): string {
  return url // sem transformações
}
```

**Passo 6.3: Integrar compressão no upload**

No teu componente de upload de fotos:

```typescript
const handleUpload = async (photos: string[]) => {
  const compressedPhotos = []
  
  for (const photo of photos) {
    const compressed = await compressImage(photo)
    compressedPhotos.push(compressed)
  }
  
  await uploadPropertyPhotos(compressedPhotos)
}
```

**Passo 6.4: Usar thumbnails no feed**

No componente `PropertyCard.tsx`:

```typescript
import { getThumbnail } from '../utils/image-utils'

// ANTES:
<Image source={{ uri: property.images[0] }} />

// DEPOIS:
<Image 
  source={{ uri: getThumbnail(property.images[0], 300, 60) }}
  style={styles.image}
/>
```

No `PropertyDetail.tsx` (imagem principal):

```typescript
import { getFullImage } from '../utils/image-utils'

<Image 
  source={{ uri: getFullImage(property.images[0]) }}
  style={styles.fullImage}
/>
```

✅ Testa AGORA:
1. Upload de foto 5MB → espera e vê console log
2. Deve aparecer: `Compressão: 5200.0KB → 380.0KB`
3. Abre feed → Network tab mostra URLs com `?width=300&quality=60`
4. Imagens carregam MUITO mais rápido (mede tempo)

---

### DIA 7: Cache com React Query + expo-image

**Passo 7.1: Substituir Image por expo-image**

Instala:

```bash
npx expo install expo-image
```

Em TODO componente que usa `<Image>`, substitui:

```typescript
// ANTES:
import { Image } from 'react-native'

<Image 
  source={{ uri: getThumbnail(photo) }}
  style={styles.image}
  resizeMode="cover"
/>

// DEPOIS:
import { Image } from 'expo-image'

<Image 
  source={{ uri: getThumbnail(photo) }}
  style={styles.image}
  contentFit="cover"
  transition={200} // fade suave
  placeholder={{ 
    blurhash: 'L6PZfSjE.AyE_3t7t7R**E?b.' 
  }}
  cachePolicy="memory-disk" // ← IMPORTANTE: cache em RAM + disco
/>
```

**Blurhash placeholder (opcional):**
- Gera em https://blurha.sh/ (coloca imagem lá, copia hash)
- Ou ignora placeholder se não quiseres

**Passo 7.2: Verificar cache**

1. Abre app com DevTools inspection
2. Navega para feed → imagens carregam
3. Volta para home e volta ao feed:
   - **Com cache:** imagens aparecem INSTANTANEAMENTE, sem loading spinner
   - Network tab: não mostra novas requests de imagem
4. Desliga rede Wi-Fi/dados:
   - Feed ainda mostra imagens (do cache disk)
   - App NÃO quebra

✅ Se tudo funcionar, FASE 2 COMPLETA!

---

## 🟢 FASE 3: TESTES + POLIMENTO (DIAS 8-10)

### DIA 8: Testes de Segurança Exaustivos

**Teste 1: RLS Policies**

1. Abre console do navegador (Chrome DevTools)
2. Logado como User A:
   ```javascript
   // Tenta ler mensagens de User B (substitui IDs)
   fetch('https://SEU_PROJECT.supabase.co/rest/v1/messages', {
     headers: {
       'apikey': 'ANON_KEY',
       'Authorization': `Bearer ${accessTokenUserA}`
     }
   }).then(r => console.log(r.status)) // Deve ser 401/403
   ```

3. Tenta modificar property de outro:
   ```javascript
   fetch('https://SEU_PROJECT.supabase.co/rest/v1/properties?id=eq.ID_DE_OUTRO', {
     method: 'PATCH',
     headers: {
       'apikey': 'ANON_KEY',
       'Authorization': `Bearer ${accessTokenUserA}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ title: 'Hackeado' })
   }).then(r => console.log(r.status)) // Deve ser 401/403
   ```

✅ NENHUM destes deve ter status 200

---

**Teste 2: Validação de Property**

1. Tenta criar property via API (Postman/Insomnia/Thunder Client):
   - Preço negativo → 400 Bad Request
   - Título com `<script>` → 400
   - Descrição com 5 chars → 400
   - Dados válidos → 201 Created

2. No app, tentaFields com dados inválidos → mensagem de erro específica aparecer

---

**Teste 3: Referral Codes**

1. Criar 3 affiliates diferentes
2. Verificar que todos têm `referral_code` preenchido
3. Verificar que são ÚNICOS (nenhum repetido)

---

### DIA 9: Testes de Performance

**Setup:**
- Usa dispositivo Android **fraco** (ou emulator com 1GB RAM)
- Usa rede 3G simulada (Chrome DevTools → Network → Slow 3G)

**Teste 1: Feed com 50 properties mock**

1. Popula banco com 50 properties fixtures (SQL ou script)
2. Abre feed:
   - First paint < 2 segundos
   - Scroll fluido (FPS > 45 em performance monitor)
   - Não trava nem congela

**Teste 2: Upload de imagem grande**

1. Foto de 6-8MB da câmara
2. Upload → ver console:
   - Compressão: ~500KB final
3. Ver storage Supabase: arquivo < 1MB

**Teste 3: Paginação**

1. Scroll até final do feed
2. Deve carregar mais 20 automaticamente
3. Repetir 3x (80+ items) — sem crash, sem memory warning

**Teste 4: Cache**

1. Abre feed (com rede)
2. Voltar e voltar ao feed:
   - Não aparece loading spinner
   - DevTools Network: nenhuma request properties
3. Esperar 6 minutos (staleTime) e voltar:
   - Agora sim faz nova request

---

### DIA 10: Testes de Experiência + Correções

**Teste 1: Offline detection (mínimo)**

1. Desliga rede no dispositivo
2. Abre app:
   - Deve aparecer banner "Sem conexão" (se implementaste)
   - Feed NÃO quebra — mostra dados do cache
   - Tentar fazer upload → erro gracioso

**Teste 2: Dados móveis**

1. Ativa dados móveis (não WiFi)
2. Navega normal:
   - Feed carrega rápido (thumbnails 300px)
   - Não consome GB em poucos minutos

**Teste 3: Error handling**

1. Simula erro de rede (Airplane mode momentâneo durante request)
2. App deve:
   - Mostrar mensagem "Tentar novamente"
   - Não crashar
   - Retry automático? (opcional)

**Correções finais:**
- Fix bugs encontrados
- Ajusta Margins/Paddings inconsistentes
- Verifica que não há console.errors no production build

---

## ✅ CHECKLIST FINAL ANTES DO LAUNCH

### Segurança (CRÍTICO)
- [ ] RLS policies em TODAS as tabelas testadas
- [ ] Validação server-side funcionando
- [ ] Referral codes gerados no servidor
- [ ] Testei: não consigo ver dados de outros usuários

### Performance (OBRIGATÓRIO)
- [ ] Índices criados no Supabase
- [ ] Paginação em TODAS as listas (HomeFeed, Search, Chat history)
- [ ] Imagens comprimidas (< 500KB cada)
- [ ] Thumbnails automáticos (\?width=300&quality=60)
- [ ] FlatList com getItemLayout, windowSize, removeClipped
- [ ] React Query configurado (staleTime 5min, cacheTime 30min)
- [ ] expo-image com cachePolicy="memory-disk"

### Experiência (OBRIGATÓRIO)
- [ ] Scroll suave em Android fraco
- [ ] Feed carrega < 2s na primeira vez
- [ ] Voltar ao feed é instantâneo (cache)
- [ ] Offline: app não quebra, mostra cache
- [ ] Upload de fotos comprimidas automaticamente

### Infraestrutura (VERIFICAR)
- [ ] Storage Supabase < 500MB (com 50 properties mock)
- [ ] Database size < 100MB
- [ ] Não há queries lentas (> 1s) no dashboard
- [ ] Realtime connections < 50 simultâneos (teste com 10 users)

---

## 🚀 PRÓXIMOS PASSOS APÓS ESTE ROADMAP

Quando tiveres isto tudo funcionando:

1. **Piloto com 10-20 usuários reais** (amigos, família)
   - Coleta feedback
   - Monitora crash reports

2. **Melhorias pós-MVP:**
   - Full-text search (pgvector) se properties > 5k
   - CDN ativado (Supabase Pro $25/mês quando necessário)
   - Sistema de avaliações (ratings)
   - Mapa interativo
   - Analytics (Mixpanel free tier)

3. **Quando rentabilizar:**
   - Primeiro R$ veio de comissões? Investe em:
     - Supabase Pro ($25/mês) — remove limites
     - Cloudflare Images ($5/mês) — CDN otimizado
     - Sentry ($26/mês) — crash reporting

---

## 🆘 Se Ficares Bloqueado

1. **Problema com RLS?** Testa no Supabase Table Editor:
   - Logas como user A, abres tabela properties
   - Deves ver SÓ as tuas properties ou as ativas públicas
   - Qualquer outro erro → RLS mal configurada

2. **FlatList ainda lento?**
   - Verifica se getItemLayout altura está CORRETA
   - Se não for exata, scroll fica pior — ajusta até ficar smooth

3. **Imagens ainda grandes?**
   - Verifica se compressão está a correr (console.log)
   - Talvez fotos já sejam pequenas (< 1MB) — ok então

4. **Cache não funciona?**
   - React Query Devtools: ver se queries têm `status: "success"`
   - Ver se `cacheTime` foi configurado no QueryClient
   - Se usas `fetch` diretamente (sem React Query), cache não funciona

---

## 📞 Precisa de Ajuda?

Se ficares preso em algum passo específico, posso:
- Detalhar o código em questão
- Dar exemplos completos
- Ajudar a debuggar

Fala qual passo e onde estás.

---

**Boa implementação! Um mês focado nisto → app sólido para 500 usuários.**

✅ Começa pelo **DIA 1** agora mesmo.
