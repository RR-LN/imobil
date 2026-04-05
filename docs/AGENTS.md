# AGENTS.md

Guide for AI agents working in the KuGava React Native/Expo codebase.

## Project Overview

KuGava is a real estate property listing mobile app for Mozambique, built with React Native and Expo. It features property browsing, user authentication, booking appointments, in-app chat, and an affiliate referral program.

## Essential Commands

```bash
# Start development server
npm start

# Start for specific platform
npm run android # Android
npm run ios # iOS
npm run web # Web (limited support)

# TypeScript check
npx tsc --noEmit

# No test suite configured yet
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Set required environment variables:
   - `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - Optional: `EXPO_PUBLIC_APP_NAME`, `EXPO_PUBLIC_APP_SCHEME`, feature flags

## Architecture

### Tech Stack

- **Framework**: React Native with Expo SDK 55
- **Navigation**: React Navigation (native stack + bottom tabs)
- **State Management**: Zustand (stores in `src/store/`)
- **Data Fetching/Caching**: TanStack Query (React Query) v5
- **Network Detection**: @react-native-community/netinfo
- **Backend**: Supabase (auth, database, storage, edge functions)
- **Language**: TypeScript with strict mode

### Directory Structure

```
src/
├── screens/          # Screen components organized by feature
│   ├── auth/         # LoginScreen, RegisterScreen
│   ├── home/         # HomeFeedScreen, PropertyDetailScreen, ChatScreen, etc.
│   ├── appointments/ # AppointmentsScreen
│   ├── profile/      # ProfileScreen, AffiliateScreen, MyPropertiesScreen
│   └── search/       # SearchScreen
├── navigation/       # React Navigation configuration
│   ├── RootNavigator.tsx  # Auth vs Main app routing
│   ├── AuthStack.tsx      # Login/Register flow
│   ├── MainTabs.tsx       # Bottom tab navigation
│   ├── HomeStack.tsx      # Home screen stack
│   └── ProfileStack.tsx   # Profile screen stack
├── store/            # Zustand state stores (legacy, prefer React Query hooks)
│   ├── authStore.ts      # Authentication state
│   ├── affiliateStore.ts # Affiliate/referral state
│   └── propertiesStore.ts # Property listing state
├── services/         # API and external service integrations
│   ├── supabase.ts       # Supabase client + type definitions
│   ├── authService.ts    # Auth operations
│   ├── propertiesService.ts # Property CRUD operations
│   ├── affiliateService.ts # Referral/affiliate operations
│   ├── bookingService.ts # Appointment booking
│   ├── chatService.ts    # Messaging
│   └── notificationService.ts # Push notifications
├── providers/        # React context providers
│   ├── QueryProvider.tsx    # TanStack Query provider
│   └── OfflineProvider.tsx  # Network status provider
├── constants/
│   └── theme.ts      # Design tokens (colors, typography, spacing)
├── hooks/            # Custom React hooks
│   ├── useQuery.ts         # React Query utilities + query keys
│   ├── useOfflineMutation.ts # Offline-aware mutation hooks
│   ├── useProperties.ts    # Property fetching hooks
│   ├── useAffiliate.ts     # Affiliate data hooks
│   ├── useBookings.ts      # Booking hooks
│   └── useReferralCode.ts  # Referral code handling
├── utils/            # Utility functions
│   ├── commission.ts      # Affiliate commission calculations
│   └── referralHandler.ts
└── components/
    ├── ui/            # Reusable UI components
    ├── ErrorBoundary.tsx   # Global error handler
    ├── Toast.tsx           # Toast notification system
    ├── LoadingOverlay.tsx  # Modal loading indicator
    ├── LoadingStates.tsx   # Loading screen/skeleton components
    ├── OfflineBanner.tsx   # Offline status banner
    └── ErrorMessage.tsx    # Error display component
```

### Navigation Flow

```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainTabs (authenticated)
    ├── HomeTab → HomeStack
    │   ├── HomeFeedScreen
    │   ├── PropertyDetailScreen
    │   ├── ChatScreen
    │   └── BookingScreen
    ├── SearchTab → SearchScreen
    ├── MessagesTab → ConversationsScreen
    ├── AppointmentsTab → AppointmentsScreen
    └── ProfileTab → ProfileStack
        ├── ProfileScreen
        ├── AffiliateScreen
        ├── MyPropertiesScreen
        └── CreatePropertyScreen
```

## Code Patterns

### State Management (Zustand)

Stores follow a consistent pattern:

```typescript
interface XxxState {
  // State fields
  data: Type | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchData: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useXxxStore = create<XxxState>((set, get) => ({
  // Initial state
  data: null,
  isLoading: false,
  error: null,

  // Action implementations
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await service.getData();
      set({ data: result, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ data: null, isLoading: false, error: null }),
}));
```

### Services Layer

Services wrap Supabase operations with consistent error handling:

```typescript
export const getXxx = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as Type, error: null };
  } catch (error: any) {
    console.error('GetXxx error:', error);
    return { data: null, error };
  }
};
```

### Screen Components

Screens use typed navigation props:

```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeStack';

type Props = NativeStackScreenProps<HomeStackParamList, 'ScreenName'>;

export const ScreenName: React.FC<Props> = ({ navigation, route }) => {
  // Component implementation
};
```

### Styling

- Use design tokens from `src/constants/theme.ts`:
  - `colors` - Earth tone palette (terra, forest, cream, charcoal)
  - `spacing` - xs(4), sm(8), md(12), lg(16), xl(24), xxl(32)
  - `borderRadius` - sm(8), md(12), lg(16), xl(24), full(9999)
  - `textStyles` - Pre-built text styles (hero, title, heading, body, caption)
  - `shadows` - sm, md, lg with elevation for Android
- Create styles using `StyleSheet.create()` at component bottom
- Use `useSafeAreaInsets()` for safe area handling

## Database Schema

### Core Tables

- **profiles** - User data (extends auth.users)
  - `id`, `full_name`, `avatar_url`, `role`, `phone`, `created_at`
  - Roles: `buyer`, `seller`, `agent`, `affiliate`

- **properties** - Real estate listings
  - `id`, `owner_id`, `title`, `description`, `type`, `transaction`, `price`, `currency`, `location`, `city`, `area_m2`, `bedrooms`, `bathrooms`, `parking`, `images[]`, `status`, `is_featured`, `created_at`
  - Types: `house`, `land`, `apartment`
  - Transactions: `sale`, `rent`
  - Status: `active`, `inactive`, `sold`, `rented`

- **conversations** - Chat threads
  - `id`, `property_id`, `buyer_id`, `seller_id`, `created_at`

- **messages** - Chat messages
  - `id`, `conversation_id`, `sender_id`, `content`, `type`, `created_at`
  - Types: `text`, `booking`, `image`

- **bookings** - Property visit appointments
  - `id`, `property_id`, `buyer_id`, `agent_id`, `scheduled_at`, `status`, `notes`, `created_at`
  - Status: `pending`, `confirmed`, `cancelled`, `completed`

- **affiliates** - Referral program participants
  - `id`, `referral_code`, `referred_by`, `level`, `total_earnings`, `created_at`
  - Levels: `bronze`, `silver`, `gold`, `platinum`

- **referrals** - Referral tracking
  - `id`, `affiliate_id`, `referred_user_id`, `property_id`, `status`, `commission_amount`, `created_at`

### Row Level Security

All tables have RLS enabled. Key policies:
- Users can only update/delete their own data
- Properties are viewable by everyone
- Messages viewable by conversation participants
- Affiliates can only see their own data

## Affiliate/Commission System

### Commission Rates
- **Agents**: 2% of property value
- **Regular users**: 0.5% or minimum 500 MZN (whichever is higher)
- **Registration bonus**: 200 MZN
- **Visit confirmation bonus**: 500 MZN

### Level Thresholds (by completed referrals)
- **Bronze**: 0-5 conversions
- **Silver**: 6-15 conversions
- **Gold**: 16-30 conversions
- **Platinum**: 31+ conversions

### Referral Code Format
`KG` + first 6 letters of name + random 3-digit number
Example: `KGJOHNSMITH123`

## Localization

- Primary language: Portuguese (Mozambique)
- Currency: MZN (Metical) - also supports USD, ZAR
- Use `pt-MZ` locale for number formatting
- All user-facing text in Portuguese

## Gotchas & Important Notes

### Supabase Client Setup
- Uses `react-native-url-polyfill/auto` for URL handling
- AsyncStorage used for session persistence
- Session auto-refresh enabled, URL detection disabled

### TypeScript Configuration
- Extends `expo/tsconfig.base`
- Strict mode enabled
- `supabase/functions` excluded from compilation

### Push Notifications
- Only work on physical devices (not simulators)
- Requires `EXPO_PUBLIC_PROJECT_ID` for Expo push tokens
- Token stored in `profiles.push_token` column

### Image Handling
- Uses `expo-image-picker` for mobile image selection
- Images uploaded to Supabase Storage `properties` bucket
- Property images stored as array of URLs

### Navigation State
- Auth state checked via `useAuthStore().isAuthenticated`
- `RootNavigator` shows splash screen while loading session
- Navigation structure: Stack navigators inside Tab navigator

### Common Pitfalls
- Don't forget `useSafeAreaInsets()` for screens with headers/footers
- Always handle loading/error states in stores
- Use `console.error` for service errors (not `console.log`)
- Supabase queries return `{ data, error }` - always check both
- Use `.single()` for unique queries, handle PGRST116 error code for "not found"

## Supabase Edge Functions

Located in `supabase/functions/`:
- `process-referral-commission/` - Handles commission processing on booking confirmation

Migration files in `supabase/migrations/`:
- `20240323_referral_commission_trigger.sql` - Trigger for automatic commission processing

## Type Definitions

Core types defined in `src/services/supabase.ts`:
- `Profile`, `Property`, `Message`, `Conversation`, `Booking`, `Affiliate`, `Referral`

Commission types in `src/utils/commission.ts`:
- `CommissionType`, `CommissionEvent`, `CommissionCalculation`

## Testing

No test suite is currently configured. When adding tests:
- Use Jest with React Native Testing Library
- Mock Supabase client for unit tests
- Use MSW for API mocking in integration tests

## Data Caching (React Query)

### Query Keys

All query keys are centralized in `src/hooks/useQuery.ts`:

```typescript
queryKeys.properties.all // ['properties']
queryKeys.properties.list(filters) // ['properties', 'list', { type: 'house' }]
queryKeys.properties.detail(id) // ['properties', 'detail', 'abc-123']
queryKeys.affiliate.stats() // ['affiliate', 'stats']
```

### Default Cache Settings

- `staleTime`: 5 minutes (data considered fresh)
- `gcTime`: 30 minutes (cache garbage collection)
- `retry`: 1 (retry failed requests once)

### Invalidation

After mutations, invalidate relevant queries:

```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
```

## Error Handling

### ErrorBoundary

Wraps entire app in `App.tsx`. Catches unexpected errors and shows fallback UI with retry button.

### Toast Notifications

```typescript
import { useToast } from './components/Toast';

const { showError, showSuccess, showWarning, showInfo } = useToast();
showSuccess('Sucesso!'); // Green toast
showError('Erro!'); // Red toast
showWarning('Atenção!'); // Yellow toast
showInfo('Info'); // Gray toast
```

### LoadingOverlay

Modal loading indicator for blocking operations:

```typescript
import { LoadingOverlay } from './components/ui';

<LoadingOverlay visible={isLoading} message="A carregar..." />
```

### ErrorMessage

Error display with retry button:

```typescript
import { ErrorMessage } from './components/ui';

if (error) return <ErrorMessage message={error.message} onRetry={refetch} />;
```

## Offline Handling

### OfflineProvider

Wraps app and tracks network status:

```typescript
import { useOffline } from './providers/OfflineProvider';

const { isOnline, isOffline, checkConnection } = useOffline();
```

### OfflineBanner

Shows banner when offline:

```typescript
import { OfflineBanner } from './components/ui';

<OfflineBanner /> // Shows "Sem conexão à internet" banner when offline
```

### Offline-aware Mutations

Use `useOfflineMutation` for operations that require internet:

```typescript
import { useOfflineMutation } from './hooks/useOfflineMutation';

const mutation = useOfflineMutation({
  mutationFn: (data) => propertiesService.createProperty(data),
  successMessage: 'Imóvel criado com sucesso!',
  onSuccess: (data) => navigation.navigate('PropertyDetail', { id: data.id }),
});

// Checks connection before executing
mutation.mutate(propertyData);
```

### Offline-aware Queries

Use `useOfflineQuery` for data fetching with offline support:

```typescript
import { useOfflineQuery } from './hooks/useOfflineMutation';

const { data, isLoading, error } = useOfflineQuery({
  queryKey: ['properties', 'list'],
  queryFn: () => propertiesService.getProperties(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Behavior When Offline

- Queries return cached data if available
- Mutations show toast message asking to connect
- Retry disabled when offline (prevents unnecessary retries)
- Banner shows "Sem conexão à internet" at top of screen
