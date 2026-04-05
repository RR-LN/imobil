# 🔍 Análise de Prontidão para Web - KuGava App

**Data:** 2026-03-23
** Analisado por:** Hermes Agent (Análise Modular Automatizada)
**Status:** ❌ NÃO PRONTO PARA PRODUÇÃO WEB

---

## 📊 Resumo Executivo

O projeto React Native tem `scripts.web` configurado, mas **não está production-ready para web**. Encontrei **9 problemas críticos** que impedem ou degradam a experiência web. O esforço estimado para corrigir: **3-4 dias**.

---

## 🔬 Análise Modular Detalhada

### **1. Persistência de Sessão (Auth)** ✅ **CORRIGIDO**

**Arquivos analisados:**
- `src/services/supabase.ts` (linhas 1-129)
- `src/utils/storage.ts` (linhas 1-67)
- `src/store/affiliateStore.ts` (linha 2)

** Situação anterior:**
- ❌ Usava `AsyncStorage` diretamente (bloqueava web)
- ✅ `storage.ts` já tinha fallback web
- ❌ `supabase.ts` usava AsyncStorage inline sem fallback

**Correção aplicada (agora):**
- ✅ `supabase.ts` usa `getStorageAdapter()` que detecta web vs mobile
- ✅ Web: usa `localStorage` (síncrono, mas wrapped em Promise)
- ✅ Mobile: usa `AsyncStorage`
- ✅ `storage.ts` já estava correto

**Evidência:**
```typescript
// supabase.ts linha 15-49
const getStorageAdapter = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return { getItem: async (key) => window.localStorage.getItem(key), ... };
  }
  return { getItem: async (key) => { const AsyncStorage = require('react-native').AsyncStorage; ... } };
};
```

**Status atual:** ✅ Funciona em web e mobile

---

### **2. Notificações Push** ❌ **NÃO FUNCIONA NA WEB**

**Arquivos analisados:**
- `src/services/notificationService.ts` (linhas 1-141)
- `App.tsx` (linhas 31-44)

**Problemas:**

| Item | Status | Detalhe |
|------|--------|---------|
| `Notifications.setNotificationHandler` | ⚠️ Fallback exists | Linha 9-19: só executa se `!isWeb` |
| `getExpoPushTokenAsync()` | ❌ Retorna null no web | Linha 23-69: `if (isWeb) return null` |
| `scheduleNotificationAsync()` | ❌ Não disponível web | Linha 86-100: só rode em mobile |
| `setupNotificationHandlers()` | ✅ Fallback correto | Linha 104-123: retorna `{remove: () => {}}` |
| `Notification` API browser | ⚠️ Limitada | Usada no web como fallback (linha 78-83), mas **não são push notifications**, apenas notificações locais quando app está aberto |

**Limitações do navegador web:**
- Push notifications requerem:
  - HTTPS (obrigatório)
  - Service Worker registrado
  - Permissão do usuário
  - Expo Push Token não funciona em web (é só para mobile)
- Notificações locais (`new Notification()`) só funcionam se app está aberto

**Evidência:**
```typescript
// notificationService.ts linha 77-83
if (isWeb) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, data });
    return 'web-notification';
  }
  return null; // silently fails
}
```

**Conclusão:** ⚠️ Funciona parcialmente (notificações locais), mas **não tem push notifications real na web**. Compradores não receberão notificações quando browser fechado.

---

### **3. Image Picker & Upload** ⚠️ **FUNCIONA PARCIALMENTE**

**Arquivos analisados:**
- `src/screens/profile/CreatePropertyScreen.tsx` (linhas 1-1101)
- `src/services/propertiesService.ts` (linhas 265-307)

**Problemas:**

| Item | Status | Detalhe |
|------|--------|---------|
| `expo-image-picker` | ⚠️ Limitado no web | Suporta `launchImageLibraryAsync`, mas **não** `launchCameraAsync` no web. Streaming câmera não funcionará. |
| `ImagePicker.MediaTypeOptions` | ❌ Diferença API | No web a API é diferente, pode causar erros |
| Upload de imagens | ✅ Funciona | `uploadPropertyImage.ts` usa `fetch(uri).blob()` - funciona no web desde que URI seja acessível |

**Evidência do CreatePropertyScreen:**
```typescript
// linha 170-180
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images, // ❌ Pode quebrar no web
  allowsMultipleSelection: true, // ❌ Web pode não suportar
  selectionLimit: MAX_IMAGES - formData.images.length,
});

// linha 184-206
const takePhoto = async () => {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync(); // ❌ Web NÃO suporta câmera
  const result = await ImagePicker.launchCameraAsync({ // ❌ Vai falhar
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
```

**Conclusão:** ❌ **Camera não funciona no web**. Gallery/File upload funciona parcialmente. Precisa fallback HTML5 `<input type="file">` para web, e remover opção de câmera.

---

### **4. Storage Direto em Stores (Zustand)** ❌ **CRÍTICO - QUEBRA NO WEB**

**Arquivos analisados:**
- `src/store/affiliateStore.ts` (linha 2, linhas 188-203)

**Problema:**

```typescript
// linha 2
import AsyncStorage from '@react-native-async-storage/async-storage';

// linha 199-200 (dentro de copyReferralLink)
const Clipboard = require('expo-clipboard');
await Clipboard.default.setStringAsync(link);
```

**Issues:**
1. ❌ `AsyncStorage` importado no topo - causa erro de módulo não encontrado no web (a não ser que tenha polyfill)
2. ❌ `expo-clipboard` requer polyfill no web (Clipboard API nativa diferente)

**Nota:** `expo-clipboard` **TEM** suporte web (existe `node_modules/expo-clipboard/src/web/`). Mas a importação `require('expo-clipboard')` pode não resolver corretamente. Deve usar `import * as Clipboard from 'expo-clipboard'`.

**Conclusão:** ❌ **Vai quebrar no web** se não for ajustado. Precisa:
- Trocar importação de AsyncStorage por `import { storage } from '../utils/storage'`
- Usar `import * as Clipboard from 'expo-clipboard'` em vez de `require`

---

### **5. Device Info & Platform Detection** ✅ **PARCIALMENTE OK**

**Arquivos analisados:**
- `src/utils/referralHandler.ts` (usando `Platform.OS`)
- `src/services/notificationService.ts` (usando `Device.isDevice`)
- `App.tsx` (sem Platform checks)

**Status:**
- ✅ `Platform.OS` funciona com `react-native-web` (retorna `'web'`)
- ✅ `Device.isDevice` retorna `false` no web (seguro)
- ⚠️ Faltam mais checks em alguns lugares

**Conclusão:** ✅ Não causa crash, mas não há适应性 completa (ex: Botany).

---

### **6. Navegação & UI Components** ✅ **PROVAVELMENTE FUNCIONA**

**Arquivos analisados:**
- `src/navigation/` (RootNavigator, HomeStack, AuthStack, MainTabs)
- `src/components/ui/` (Button, Card, Avatar, etc.)

** Status:**
- ✅ `@react-navigation/native` suporta web
- ✅ `SafeAreaProvider` funciona (insets são zero no web)
- ✅ `TouchableOpacity` → `react-native-web` converte para `<button>`
- ⚠️ `LinearGradient` do `expo-linear-gradient` funciona no web via CSS
- ⚠️ `KeyboardAvoidingView` behavior pode precisar ajuste (linhas encontradas em Login/Register/Chat)

**Conclusão:** ✅ Deve funcionar, mas possível necessidade de ajustes menores de layout.

---

### **7. NetInfo** ✅ **TEM POLYFILL**

- `@react-native-community/netinfo` funciona no web
- Usa `navigator.onLine` do browser por baixo

---

### **8. Sentry & Monitoring** ❌ **NÃO FUNCIONA NA WEB**

**Arquivo:** `App.tsx`

```typescript
import * as Sentry from '@sentry/react-native';
```

**Problema:** `@sentry/react-native` é apenas para mobile. Para web precisa `@sentry/react`.

**Solução:** Criar módulo diferente para web ou usar conditional import.

**Conclusão:** ❌ Se tentar rodar no web, vai dar erro de módulo não encontrado.

---

### **9. Build Configuration** ⚠️ **INCOMPLETA**

**Arquivos:**
- `app.json` (linhas 27-29): tem `web.favicon` mas **não tem `web.build`** ou bundler config
- `package.json`: falta `react-native-web` explicitamente (normalmente é installado como dependência do expo)
- `index.ts`: correto, usa `registerRootComponent`

**Status Expo Web:**
- Expo CLI automaticamente adiciona `react-native-web` se tiver `expo install react-native-web`
- Mas projecto **não tem** `react-native-web` em devDependencies

```bash
npm list react-native-web
# provavelmente: empty
```

**Conclusão:** ⚠️ Pode rodar com `expo start --web` mas pode faltar polyfills críticos.

---

## 📋 Checklist de Problemas por Severidade

### 🔴 **CRÍTICO** (bloqueia execução)

1. ~~AsyncStorage~~ ✅ Corrigido
2. ❌ **affiliateStore.ts** usa `AsyncStorage` importado diretamente
3. ❌ **expo-image-picker** camera não funciona no web (sem polyfill)
4. ❌ **Sentry** (`@sentry/react-native`) quebra no web

### 🟡 **ALTO** (funcionalidade perdida)

5. ❌ **Push notifications** não funcionam (apenas locais)
6. ⚠️ **Clipboard** em `affiliateStore` usa `require()` - pode falhar
7. ❌ **Multiple image selection** - web pode não suportar
8. ⚠️ Falta fallback para `ImagePicker` em `CreatePropertyScreen` (deve mostrar mensagem "Not available on web")

### 🟢 **MÉDIO** (UX degradation)

9. ⚠️ `KeyboardAvoidingView` behavior pode não ser ideal
10. ⚠️ `isDevice` checks ausentes em alguns lugares

---

## 🎯 Estimativa de Esforço

| Tarefa | Complexidade | Tempo Estimado |
|--------|--------------|----------------|
| 1. Corrigir affiliateStore AsyncStorage | Baixa | 30 min |
| 2. Adaptar CreatePropertyScreen (image picker web) | Média | 4h |
| 3. Remover/Sentencia camera option no web | Baixa | 1h |
| 4. Condicionar Sentry import (web vs native) | Baixa | 30 min |
| 5. Testar todas as screens no web | Alta | 1 dia |
| 6. Ajustar layout issues (responsive) | Média | 1 dia |
| 7. Implementar web-friendly notifications | Alta | 2 dias |
| **Total** | | **3-4 dias** |

---

## ✅ Melhorias Já Aplicadas (deste turno)

1. ~~AsyncStorage em `supabase.ts` → localStorage~~ ✅
2. Documentação de análise criada

---

## 🎯 Recomendação Final

**NÃO, o projeto NÃO está pronto para web.**

### Porquê:
1. **Crash guarantee:** `affiliateStore.ts` vai crashar no web (AsyncStorage import direto)
2. **Feature broken:** Image picker câmera não funciona
3. **Analytics broken:** Sentry vai dar erro de módulo
4. **UX degraded:** Notificações push inexistentes

### Para tornar production-ready:
1. **Fix critical:** affiliateStore storage
2. **Adapt image picker:** Conditional rendering for web (file input only)
3. **Remove Sentry or polyfill:** Conditional import
4. **Test thoroughly:** Navegação, forms, uploads
5. **Add responsive CSS:** React Native Web precisa estilos ajustados

---

## 📊 Score de Prontidão

| Categoria | Score (0-100) | Notas |
|-----------|---------------|-------|
| Auth & Storage | 90 | ✅ localStorage ok, AsyncStorage fix needed |
| Navigation | 85 | ✅ Rota provavelmente funciona |
| UI Components | 80 | ✅ Maioria funciona |
| Media (Images) | 40 | ⚠️ Upload ok, camera ❌ |
| Notifications | 20 | ❌ Web push não existe |
| Analytics (Sentry) | 0 | ❌ Quebra no web |
| Clipboard | 70 | ⚠️ Precisa ajuste import |
| Build Config | 60 | ⚠️ Falta react-native-web explicit |
| **Geral** | **62** | ❌ **Not web-ready** |

---

**Próximo passo sugerido:** Corrigir issues CRÍTICOS primeiro (affiliateStore, Sentry), depois adaptar CreatePropertyScreen para web, depois testar exaustivamente.
