# 🚀 Sistema de Afiliados - Guia Rápido

## ✅ Dependências Instaladas

O projeto já tem todas as dependências necessárias:
- ✅ `zustand` - Gestão de estado
- ✅ `@react-native-async-storage/async-storage` - Persistência local
- ✅ `@supabase/supabase-js` - Base de dados

## 📋 Passos para Ativar

### 1. Executar Schema SQL (se ainda não executou)

No Supabase Dashboard → SQL Editor:

```sql
-- Tabela de afiliados
CREATE TABLE affiliates (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  level TEXT NOT NULL DEFAULT 'bronze',
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_level CHECK (level IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- Tabela de referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  status TEXT NOT NULL DEFAULT 'pending',
  commission_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Índices
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX idx_referrals_user ON referrals(referred_user_id);
```

### 2. Configurar Deep Linking (Opcional mas recomendado)

**Expo (app.json):**
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

### 3. Usar no RegisterScreen

```typescript
import { useReferralCode } from './src/hooks/useReferralCode';
import { getPendingReferral, markAsReferred } from './src/utils/referralHandler';

const RegisterScreen = () => {
  const { referralCode, hasReferral } = useReferralCode();
  
  const handleRegister = async () => {
    // Fazer signup com referral code se existir
    const pendingReferral = await getPendingReferral();
    
    const { user, error } = await signUp(
      email,
      password,
      fullName,
      role,
      phone,
      pendingReferral || undefined
    );
    
    if (pendingReferral && user) {
      await markAsReferred();
    }
  };
  
  return (
    <View>
      {hasReferral && (
        <Text>🎉 Foste convidado por um amigo!</Text>
      )}
      {/* Resto do formulário */}
    </View>
  );
};
```

### 4. Aceder ao Ecrã de Afiliados

```typescript
// Navegar para AffiliateScreen
navigation.navigate('Affiliate');

// O ecrã vai:
// 1. Carregar stats do Supabase
// 2. Gerar referral code se não existir
// 3. Mostrar lista de referrals
// 4. Permitir copiar link
```

## 🧪 Testar

### Testar Deep Link (Android)
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "kugava://ref/REF12345" \
  com.kugava.app
```

### Testar Deep Link (iOS Simulator)
```bash
xcrun simctl openurl booted "kugava://ref/REF12345"
```

### Testar Cálculo de Comissão
```typescript
import { calculateCommission } from './src/utils/commission';

// Utilizador comum, venda de 4,500,000 MZN
const commission = calculateCommission(4500000, 'user');
console.log(commission.finalAmount); // 22,500 MZN

// Agente, venda de 4,500,000 MZN
const agentCommission = calculateCommission(4500000, 'agent');
console.log(agentCommission.finalAmount); // 90,000 MZN
```

## 📊 Estrutura de Ficheiros

```
src/
├── store/
│   └── affiliateStore.ts        # Estado global
├── utils/
│   ├── commission.ts            # Cálculo de comissões
│   └── referralHandler.ts       # Deep links
├── hooks/
│   └── useReferralCode.ts       # Hooks React
├── services/
│   ├── authService.ts           # Auth com referral
│   └── affiliateService.ts      # API Supabase
└── screens/
    └── profile/
        └── AffiliateScreen.tsx  # Ecrã de afiliados
```

## 🎯 Funcionalidades

| Funcionalidade | Estado |
|----------------|--------|
| Deep linking | ✅ |
| Referral no registo | ✅ |
| Cálculo de comissões | ✅ |
| Bónus de registo (200 MZN) | ✅ |
| Bónus de visita (500 MZN) | ✅ |
| Níveis de afiliado | ✅ |
| Stats em tempo real | ✅ |
| Link copiável | ✅ |

## 📝 Próximos Passos

1. ✅ Executar schema SQL
2. ✅ Configurar deep linking (opcional)
3. ✅ Testar registo com referral
4. ✅ Testar cálculo de comissões
5. ✅ Testar ecrã de afiliados

**Tudo pronto! 🎉**
