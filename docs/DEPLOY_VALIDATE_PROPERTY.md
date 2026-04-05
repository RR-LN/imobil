# Deploy: validate-property Edge Function

## Pré-requisitos

- Ter o projeto criado no Supabase
- Ter as credenciais (URL + anon key)
- Estar logado no Supabase Dashboard

---

## Passo a Passo

### 1. Preparar código

O código já está em:
```
deving/kugava-app/supabase/functions/validate-property/index.ts
```

### 2. Dashboard: Supabase Functions

1. Abre: https://app.supabase.com/
2. Seleciona o teu projeto
3. No menu lateral esquerdo, clica em **Functions**
4. Clica no botão **"+ New Function"**

### 3. Configurar Function

- **Name:** `validate-property` (igual ao nome da pasta)
- **Runtime:** `TypeScript` (Deno)
- **Method:** `POST`
- **Verify JWT:** ✅ **Checked** (IMPORTANTE)
- **Return type:** `JSON`

### 4. Colar código

No editor que abrir:

1. Apaga qualquer código que já lá esteja
2. Copia TODO o conteúdo de:
   ```
   deving/kugava-app/supabase/functions/validate-property/index.ts
   ```
3. Cola no editor

### 5. Deploy

1. Clica no botão **"Deploy"** no canto superior direito
2. Aguarda 10-30 segundos
3. Vai aparecer a URL da function:
   ```
   https://teu-projeto.supabase.co/functions/v1/validate-property
   ```

### 6. Testar a Function

#### Teste A: Com dados válidos

Usa Thunder Client / Postman / curl:

```bash
curl -X POST https://TEU_PROJECT.supabase.co/functions/v1/validate-property \
  -H "apikey: SEU_ANON_KEY" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_USER" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Casa moderna com piscina",
      "description": "Excelente casa de 3 quartos, localizada na cidade, com área de lazer completa e piscina. Ótimo para famílias.",
      "price": 45000000,
      "city": "Maputo",
      "property_type": "house",
      "transaction": "sale",
      "bedrooms": 3,
      "bathrooms": 2,
      "area_m2": 320,
      "parking": 2,
      "has_pool": true,
      "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "title": "Casa moderna com piscina",
    "price": 45000000,
    // ...
  }
}
```

#### Teste B: Com dados inválidos

```bash
curl -X POST https://TEU_PROJECT.supabase.co/functions/v1/validate-property \
  -H "apikey: SEU_ANON_KEY" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_USER" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "AB",  // ❌ muito curto
      "price": -1000   // ❌ negativo
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": false,
  "errors": [
    {"field": "title", "message": "Título deve ter pelo menos 5 caracteres"},
    {"field": "price", "message": "Preço deve ser positivo"}
  ]
}
```

---

## 7. Integrar na tua App

No teu código onde crias properties (ex: `services/property.service.ts`):

```typescript
async function createProperty(propertyData: any) {
  // 1. Obter access token do utilizador logado
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error('Utilizador não autenticado');
  }

  // 2. Chamar Edge Function
  const validateRes = await fetch(
    'https://TEU_PROJECT.supabase.co/functions/v1/validate-property',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': 'SEU_ANON_KEY',  // podes obter de env variable
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: propertyData }),
    }
  );

  const validateJson = await validateRes.json();

  if (!validateJson.success) {
    // Mostrar erros específicos ao utilizador
    const errorMessages = validateJson.errors?.map((e: any) =>
      `${e.field}: ${e.message}`
    ).join('; ') || 'Dados inválidos';

    throw new Error(`Validação falhou: ${errorMessages}`);
  }

  // 3. Só insere se válido
  const { data, error } = await supabase
    .from('properties')
    .insert(validateJson.data) // dados já validados
    .select()
    .single();

  if (error) throw error;

  return { data };
}
```

---

## 🔧 Variáveis de Ambiente

Na tua app React Native, adiciona ao `.env`:

```env
EXPO_PUBLIC_SUPABASE_FUNCTION_URL=https://TEU_PROJECT.supabase.co/functions/v1
```

E usa:

```typescript
const FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL + '/validate-property';
```

---

## ⚠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| 401 Unauthorized | Token expirado ou não enviado. Verifica `accessToken` |
| 403 Forbidden | JWT verification falhou. Verifica "Verify JWT" está ativado |
| Function not found | URL errada. Verifica nome exato da function |
| Timeout | Request demora muito. Aumenta timeout no fetch |
| Erro 500 | Log no Supabase Dashboard → Function logs |

---

## 📊 Next Steps

Após a function funcionar:

✅ **Testar** com property inválida → deve retornar 400
✅ **Testar** com property válida → deve retornar 200
✅ **Integrar** no fluxo de criação de properties
✅ **Remover** validações duplicadas do frontend (agora server é fonte da verdade)

---

**Próximo:** DIA 3 — Referral codes server-side trigger
