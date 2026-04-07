import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorageSync } from '../utils/storage';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

// Storage adapter for zustand persistence
const zustandStorage = {
  getItem: (name: string) => {
    const value = getStorageSync.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => {
    getStorageSync.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    getStorageSync.removeItem(name);
  },
};

interface Collection {
  id: string;
  name: string;
  propertyIds: string[];
  createdAt: string;
}

interface FavoritesState {
  favorites: string[]; // property IDs
  collections: Record<string, Collection>;
  isLoading: boolean;
  lastSyncedAt: string | null;
  
  // Actions
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  syncWithCloud: () => Promise<void>;
  addToCollection: (collectionId: string, propertyId: string) => void;
  removeFromCollection: (collectionId: string, propertyId: string) => void;
  createCollection: (name: string) => string;
  deleteCollection: (collectionId: string) => void;
  renameCollection: (collectionId: string, newName: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      collections: {},
      isLoading: false,
      lastSyncedAt: null,

      toggleFavorite: async (propertyId: string) => {
        const { favorites } = get();
        const isFav = favorites.includes(propertyId);
        const { user } = useAuthStore.getState();

        // Optimistic update
        const newFavorites = isFav
          ? favorites.filter((id) => id !== propertyId)
          : [...favorites, propertyId];
        
        set({ favorites: newFavorites });

        // Sync with Supabase if logged in
        if (user) {
          try {
            if (isFav) {
              await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('property_id', propertyId);
            } else {
              await supabase
                .from('favorites')
                .insert({
                  user_id: user.id,
                  property_id: propertyId,
                });
            }
          } catch (error) {
            console.error('Sync error:', error);
            // Revert on error
            set({ favorites });
          }
        }
      },

      isFavorite: (propertyId: string) => {
        return get().favorites.includes(propertyId);
      },

      syncWithCloud: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('property_id')
            .eq('user_id', user.id);

          if (error) throw error;

          const cloudFavorites = data?.map((f) => f.property_id) || [];
          
          set({ 
            favorites: cloudFavorites,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Fetch favorites error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createCollection: (name: string) => {
        const id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newCollection: Collection = {
          id,
          name,
          propertyIds: [],
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          collections: {
            ...state.collections,
            [id]: newCollection,
          },
        }));
        
        return id;
      },

      deleteCollection: (collectionId: string) => {
        set((state) => {
          const { [collectionId]: _, ...rest } = state.collections;
          return { collections: rest };
        });
      },

      renameCollection: (collectionId: string, newName: string) => {
        set((state) => ({
          collections: {
            ...state.collections,
            [collectionId]: {
              ...state.collections[collectionId],
              name: newName,
            },
          },
        }));
      },

      addToCollection: (collectionId: string, propertyId: string) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) return state;
          
          if (collection.propertyIds.includes(propertyId)) return state;
          
          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                propertyIds: [...collection.propertyIds, propertyId],
              },
            },
          };
        });
      },

      removeFromCollection: (collectionId: string, propertyId: string) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) return state;
          
          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                propertyIds: collection.propertyIds.filter(
                  (id) => id !== propertyId
                ),
              },
            },
          };
        });
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Subscribe to realtime favorites changes
export const subscribeToFavorites = () => {
  const { user } = useAuthStore.getState();
  if (!user) return null;

  const subscription = supabase
    .channel('favorites-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${user.id}`,
      },
      () => {
        // Refresh favorites when any change occurs
        useFavoritesStore.getState().syncWithCloud();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
