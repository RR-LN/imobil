# Migração: Tabela Bookings

## 📋 Descrição

Cria a tabela `bookings` para agendamento de visitas a imóveis, com relacionamentos para propriedades, compradores e agentes.

## 🗂️ Estrutura da Tabela

```sql
bookings (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  buyer_id UUID REFERENCES profiles(id),
  agent_id UUID REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
)
```

## 🔒 Políticas de Segurança (RLS)

- **Buyers**: Podem ver os seus próprios agendamentos
- **Agents**: Podem ver agendamentos das suas propriedades
- **Sellers**: Podem ver agendamentos das suas propriedades
- **Updates**: Apenas buyer ou agent envolvido podem atualizar

## 🚀 Como Aplicar

### Opção 1: Via SQL Editor do Supabase

1. Aceda ao [Supabase Dashboard](https://app.supabase.com/)
2. Selecione o projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo de `supabase/migrations/001_create_bookings_table.sql`
6. Clique em **Run**

### Opção 2: Via CLI (local)

```bash
# Se tiver o Supabase CLI instalado
supabase db push
```

### Opção 3: Via Terraform (se configurado)

```bash
terraform apply -target="module.supabase"
```

## ✅ Verificação

Após aplicar a migration, execute no SQL Editor:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM bookings LIMIT 1;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- Verificar índices
SELECT indexname FROM pg_indexes WHERE tablename = 'bookings';
```

## 🔧 Serviços Actualizados

- `src/services/bookingService.ts`: CRUD completo para bookings
- `src/types/bookings.ts`: TypeScript types
- `src/screens/home/BookingScreen.tsx`: Integração real com API
- `src/screens/appointments/AppointmentsScreen.tsx`: Ações para agentes

## ⚠️ Notas Importantes

1. A unique constraint previne booking duplicado no mesmo horário
2. O campo `scheduled_at` combina data e hora em ISO
3. O BookingScreen agora busca dados reais da propriedade e agente
4. Agentes podem confirmar bookings pendentes no AppointmentsScreen
5. Compradores são automaticamente obtidos via `getCurrentUser()`

## 🔄 Rollback (se necessário)

```sql
DROP TABLE IF EXISTS bookings CASCADE;
```

**Cuidado**: Remove todos os dados de bookings permanentemente.
