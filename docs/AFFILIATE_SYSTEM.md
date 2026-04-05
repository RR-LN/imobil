# 🎯 KuGava - Sistema de Afiliados

Implementação completa do sistema de afiliados com Zustand, deep links e cálculo de comissões.

---

## 📦 Ficheiros Criados

### Store (Zustand)
- [x] `src/store/affiliateStore.ts` - Estado global do afiliado
  - Stats (estatísticas)
  - Referrals (lista de referrals)
  - Referral code (código pessoal)
  - Earnings (ganhos)
  - Level (nível: bronze, silver, gold, platinum)

### Utils
- [x] `src/utils/referralHandler.ts` - Deep links e gestão de referrals
  - `checkForReferralLink()` - Deteta referral no URL
  - `savePendingReferral()` - Guarda referral para registo posterior
  - `getPendingReferral()` - Obtém referral guardado
  - `initializeReferralSystem()` - Inicializa sistema no app start

- [x] `src/utils/commission.ts` - Cálculo de comissões
  - `calculateCommission()` - Calcula comissão por venda
  - `calculateRentCommission()` - Calcula comissão por renda
  - `calculateRegistrationBonus()` - Bónus de 200 MZN
  - `calculateVisitBonus()` - Bónus de 500 MZN
  - `calculateTotalCommission()` - Comissão total com bónus

### Hooks
- [x] `src/hooks/useReferralCode.ts` - Hooks React
  - `useReferralCode()` - Hook para referral code no registo
  - `usePendingReferral()` - Hook para pending referral
  - `useAffiliateStats()` - Hook para estatísticas de afiliado

### Services (Atualizados)
- [x] `src/services/authService.ts` - Adicionado suporte a referral no signUp
- [x] `src/services/affiliateService.ts` - Serviços Supabase de afiliados

### Screens (Atualizados)
- [x] `src/screens/profile/AffiliateScreen.tsx` - Ecrã com dados reais do Supabase

---

## 💰 Modelo de Comissões

### Modelo A - Agente (2%)
```typescript
comissão = valor_imóvel × 2%
```

**Exemplo:**
- Vivenda de 4,500,000 MZN
- Comissão: 4,500,000 × 0.02 = **90,000 MZN**

### Modelo B - Utilizador Comum (0.5% ou 500 MZN)
```typescript
comissão = max(valor_imóvel × 0.5%, 500 MZN)
```

**Exemplos:**
- Apartamento de 2,000,000 MZN
  - 2,000,000 × 0.005 = 10,000 MZN
  - Comissão: **10,000 MZN**

- T1 de 80,000 MZN
  - 80,000 × 0.005 = 400 MZN
  - Mínimo: 500 MZN
  - Comissão: **500 MZN**

### Bónus

| Evento | Valor | Descrição |
|--------|-------|-----------|
| Registo via link | 200 MZN | Utilizador inscreve-se via referral link |
| Visita confirmada | 500 MZN | Visita agendada e confirmada |

---

## 📊 Níveis de Afiliado

| Nível | Requisitos | Benefícios |
|-------|------------|------------|
| **Bronze** | 0-4 conversões | Comissão base |
| **Prata** | 5-9 conversões ou 10,000 MZN | +5% bónus |
| **Ouro** | 10-19 conversões ou 50,000 MZN | +10% bónus |
| **Platina** | 20+ conversões ou 100,000 MZN | +15% bónus |

---

## 🔄 Fluxo de Referral

### 1. Utilizador Clica no Link
```
kugava://ref/REF12345
   ou
https://kugava.mz/ref/REF12345
```

### 2. Sistema Deteta Deep Link
```typescript
// App.tsx ou index.ts
import { initializeReferralSystem } from './src/utils/referralHandler';

// No app start
const { hasReferral, referralCode } = await initializeReferralSystem();
// hasReferral: true
// referralCode: "REF12345"
```

### 3. Utilizador Regista-se
```typescript
// No RegisterScreen
import { useReferralCode } from './src/hooks/useReferralCode';

const { referralCode, hasReferral } = useReferralCode();

// Se hasReferral === true, mostrar:
// "Foste convidado por um amigo 🎉"

// No signUp
await signUp(email, password, fullName, role, phone, referralCode);
```

### 4. Criação do Registo de Referral
```typescript
// authService.ts
if (referralCode) {
  // Encontrar afiliado pelo código
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id')
    .eq('referral_code', referralCode)
    .single();

  if (affiliate) {
    // Criar registo de referral
    await supabase
      .from('referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: userId,
        status: 'pending',
        commission_amount: 200, // Bónus de registo
      });
  }
}
```

### 5. Negócio Fechado
```typescript
// Quando venda é concluída
const commission = calculateCommission(propertyValue, 'user');
// commission.finalAmount = 10,000 MZN (exemplo)

// Atualizar referral com comissão
await supabase
  .from('referrals')
  .update({
    status: 'completed',
    commission_amount: commission.finalAmount,
    property_id: propertyId,
  })
  .eq('id', referralId);

// Atualizar ganhos do afiliado
await supabase.rpc('update_affiliate_earnings', {
  affiliate_id: affiliateId,
  amount: commission.finalAmount,
});
```

---

## 🧪 Exemplos de Uso

### Obter Estatísticas de Afiliado
```typescript
import { useAffiliateStore } from './src/store/affiliateStore';

const AffiliateScreen = () => {
  const { stats, fetchStats, isLoading } = useAffiliateStore();
  
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <View>
      <Text>Ganhos: {stats?.totalEarnings} MZN</Text>
      <Text>Nível: {stats?.level}</Text>
      <Text>Referrals: {stats?.totalReferrals}</Text>
    </View>
  );
};
```

### Gerar Link de Referral
```typescript
import { useAffiliateStore } from './src/store/affiliateStore';

const { referralCode, generateReferralCode } = useAffiliateStore();

useEffect(() => {
  if (!referralCode) {
    generateReferralCode();
  }
}, [referralCode]);

// Link: kugava.mz/ref/REF12345
```

### Calcular Comissão
```typescript
import { calculateCommission, calculateTotalCommission } from './src/utils/commission';

// Comissão simples
const commission = calculateCommission(4500000, 'user');
// commission.finalAmount = 22,500 MZN

// Comissão com bónus
const total = calculateTotalCommission(
  4500000,
  'user',
  true,  // incluir bónus de registo
  true   // incluir bónus de visita
);
// total.totalAmount = 22,500 + 200 + 500 = 23,200 MZN
```

### Copiar Link para Clipboard
```typescript
import { useAffiliateStore } from './src/store/affiliateStore';

const { copyReferralLink } = useAffiliateStore();

const handleCopy = async () => {
  const link = await copyReferralLink();
  // Link copiado!
  Alert.alert('Link copiado!', link);
};
```

---

## 📱 Deep Linking Setup

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  
  <!-- Deep Links -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <data android:scheme="kugava" />
    <data android:host="ref" />
  </intent-filter>
</activity>
```

### iOS (ios/KuGava/Info.plist)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>kugava</string>
    </array>
  </dict>
</array>
```

### Expo Config (app.json)
```json
{
  "expo": {
    "scheme": "kugava",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "kugava" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## 🗄️ Base de Dados

### Tabela: affiliates
```sql
CREATE TABLE affiliates (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  level affiliate_level DEFAULT 'bronze',
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: referrals
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id),
  referred_user_id UUID REFERENCES profiles(id),
  property_id UUID REFERENCES properties(id),
  status referral_status DEFAULT 'pending',
  commission_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Estado Global (Zustand)
- [x] Stats de afiliado (total, completed, rate, earnings, level)
- [x] Lista de referrals
- [x] Referral code pessoal
- [x] Ganhos totais
- [x] Nível do afiliado
- [x] Loading e error states

### ✅ Deep Linking
- [x] Detetar referral code no URL
- [x] Guardar referral para registo posterior
- [x] Aplicar referral no momento do registo
- [x] Suporte a múltiplos formatos de URL

### ✅ Cálculo de Comissões
- [x] Modelo A (agente): 2%
- [x] Modelo B (utilizador): 0.5% ou 500 MZN
- [x] Bónus de registo: 200 MZN
- [x] Bónus de visita: 500 MZN
- [x] Cálculo de comissões por arrendamento
- [x] Formatação de valores em MZN

### ✅ Ecrã de Afiliados
- [x] Métricas em tempo real
- [x] Nível do afiliado
- [x] Link de referral copiável
- [x] Lista de atividade recente
- [x] Loading e error states
- [x] Dados reais do Supabase

### ✅ Integração com Auth
- [x] Referral code no signUp
- [x] Criação automática de registo de referral
- [x] Bónus de registo (200 MZN)
- [x] Verificação de referral pendente

---

## 📊 Próximos Passos

1. **Testar Deep Links**
   - Testar no Android e iOS
   - Verificar se o referral code é detetado

2. **Configurar Notificações**
   - Notificar afiliado quando ganha comissão
   - Notificar quando atinge novo nível

3. **Dashboard Avançado**
   - Gráficos de evolução
   - Histórico detalhado
   - Previsão de ganhos

4. **Otimizações**
   - Cache de dados
   - Refetch em background
   - Offline support

---

## 📞 Suporte

- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Linking](https://reactnative.dev/docs/linking)

---

**Implementação concluída!** 🎉
