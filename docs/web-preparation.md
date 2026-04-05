# 🌐 Preparação para Web - KuGava

## ⚠️ Estado Atual

O app está desenvolvido para **React Native mobile** e **pode rodar no web via Expo Web**, mas **não está otimizado**. Várias funcionalidades mobile não funcionam ou funcionam parcialmente no browser.

---

## 🔧 Adaptações Necessárias

### 1. **Auth Storage** (CRÍTICO)

**Problema:** `AsyncStorage` não existe no web.

**Solução:** Modificar `src/services/supabase.ts` para usar `localStorage` no web:tsx
import 'react-native-url-polyfill/auto';

// Platform-specific storage
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }
  // Fallback para AsyncStorage em mobile
  const AsyncStorage = require('react-native').AsyncStorage;
  return AsyncStorage;
};

const storage = getStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage,
  },
});
```

---

### 2. **Notifications** (IMPORTANTE)

**Problema:** Push notifications não funcionam em navegadores web desktop.

**Solução:** Fazer fallback condicional:

```typescript
// src/services/notificationService.ts

// No início do arquivo
const isWeb = typeof window !== 'undefined' && window.document;

export const notificationService = {
  schedulePushNotification: async (title: string, body: string, data?: any) => {
    if (isWeb) {
      // Fallback: apenas log ou alert visual
      console.log(`[Web] Notification: ${title} - ${body}`);
      // Opcional: mostrar toast/alert
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return { success: true };
    }

    // Mobile: usar expo-notifications
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: trigger, // agendamento real
    });
  },

  // ... outros métodos com fallback web
};
```

---

### 3. **Image Picker** (ALTO)

**Problema:** `expo-image-picker` tem suporte limitado no web.

**Solução:** Criar componente condicional:

```typescript
// Em CreatePropertyScreen ou PropertyDetail

import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  if (Platform.OS === 'web') {
    // Web: input file HTML
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      // Converter para base64URL que o Supabase aceita
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // Upload...
      };
      reader.readAsDataURL(file);
    };
    input.click();
    return;
  }

  // Mobile
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });
  // ...
};
```

---

### 4. **NetInfo** (BAIXO)

**Problema:** `@react-native-community/netinfo` tem polyfill para web.

**Solução:** Já deve funcionar com `expo install react-native-netinfo` (já está no package.json). Testar:

```typescript
import NetInfo from '@react-native-community/netinfo';

const state = await NetInfo.fetch();
console.log(state.isConnected); // Funciona no web
```

---

### 5. **SafeAreaView** (MÉDIO)

**Problema:** Web não tem "safe area" (notch).

**Solução:** Usar `SafeAreaProvider` já deve funcionar, mas pode ignorar inset vazios no web.

---

### 6. **Icons (Ionicons)**

**Problema:** `@expo/vector-icons` funciona no web via `react-native-vector-icons`.

**Solução:** Já deve funcionar. Testar:
```bash
npm run web
```

Se não carregar, instalar:
```bash
npm install react-native-vector-icons
```

---

## 🚀 Como Testar na Web

1. **Instalar dependências de web:**
```bash
cd /home/lieven/deving/kugava-app
npm install
```

2. **Executar:**
```bash
npm run web
# ou
npx expo start --web
```

3. **Abrir:** http://localhost:8081

4. **Testar funcionalidades:**
   - Login/Registo (Auth deve funcionar)
   - Navegação entre telas
   - Criar propriedade (imagePicker pode falhar)
   - Bookings (calendário funciona, mas notifications não)

---

## 🐛 Issues Comuns no Web

### ❌ "AsyncStorage is not defined"
**Fix:** Aplicar solução do item 1 (supabase.ts com getStorage).

### ❌ "Notifications not available"
**Fix:** Já é esperado - fazer fallback.

### ❌ "Image picker not working"
**Fix:** Implementar input file HTML condicional (item 3).

### ❌ Icons não aparecem
**Fix:**
```bash
npm install react-native-vector-icons
# Reiniciar expo
```

### ❌ Navegação lenta ou flickering
**Fix:** Adicionar `screens` configuração:
```javascript
// app.json ou expo.config.js
{
  "expo": {
    "plugins": [
      ["react-native-screens", { enableScreens: false }] // Desabilitar se der problema
    ]
  }
}
```

---

## 📱 Mobile vs Web - Comparação

| Feature | Mobile | Web |
|---------|--------|-----|
| Auth (Supabase) | ✅ AsyncStorage | ❌ precisa localStorage |
| Push Notifications | ✅ Expo Notifications | ❌ Service Worker (complicado) |
| Image Picker | ✅ Camera/Gallery | ⚠️ Input file (limitado) |
| GPS/Location | ✅ expo-location | ⚠️ navigator.geolocation |
| Camera | ✅ expo-camera | ⚠️ getUserMedia (HTTPS) |
| Haptics | ✅ Expo Haptics | ❌ não existe |
| Deep Links | ✅ Linking | ✅ URL routing |

---

## 🎯 Recomendação

**Para produção web:**
1. Corrigir AsyncStorage (CRÍTICO)
2. Implementar fallback notifications (IMPORTANTE)
3. Adaptar image picker (IMPORTANTE)
4. Testar exaustivamente no Chrome/Firefox/Safari

**Ou alternativamente:**
- Focar em mobile primeiro
- web como MVP simplificado (sem upload de imagens, sem notificações push)
- Quando mobile estiver 100%, voltar para web

---

## 💡 Conclusão

O app **pode rodar na web com expo start --web**, mas **não está production-ready** para web devido às limitações de APIs nativas.

**Esforço estimado para tornar web-ready:** 2-3 dias de trabalho.

**Prioridade:** Primeiro garantir que mobile funciona perfeito, depois web.

---

**Pergunta:** Queres que eu prepare o app para web agora (corrigir AsyncStorage e fallbacks)?
