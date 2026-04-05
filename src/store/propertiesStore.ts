import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Property } from '../services/supabase';
import {
  getProperties,
  getFeaturedProperties,
  searchProperties,
} from '../services/propertiesService';

export type PropertyFilter = 'all' | 'houses' | 'land' | 'apartments' | 'rent' | 'sale';

interface PropertiesState {
  properties: Property[];
  featuredProperties: Property[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  activeFilter: PropertyFilter;
  searchQuery: string;
  hasMore: boolean;
  page: number;
  favorites: string[];

  fetchProperties: (reset?: boolean) => Promise<void>;
  fetchFeatured: () => Promise<void>;
  setFilter: (filter: PropertyFilter) => void;
  searchPropertiesAction: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (propertyId: string) => void;
  clearError: () => void;
  reset: () => void;
}

const ITEMS_PER_PAGE = 10;

export const usePropertiesStore = create<PropertiesState>()(
  persist(
    (set, get) => ({
      properties: [],
      featuredProperties: [],
      isLoading: false,
      isSearching: false,
      error: null,
      activeFilter: 'all',
      searchQuery: '',
      hasMore: true,
      page: 0,
      favorites: [],

      fetchProperties: async (reset: boolean = false) => {
        try {
          const { activeFilter, page, properties } = get();
          const currentPage = reset ? 0 : page;

          set({ isLoading: true, error: null });

          const filters: any = {
            limit: ITEMS_PER_PAGE,
            offset: currentPage * ITEMS_PER_PAGE,
          };

          switch (activeFilter) {
            case 'houses':
              filters.type = 'house';
              break;
            case 'land':
              filters.type = 'land';
              break;
            case 'apartments':
              filters.type = 'apartment';
              break;
            case 'rent':
              filters.transaction = 'rent';
              break;
            case 'sale':
              filters.transaction = 'sale';
              break;
          }

          const { properties: newProperties, error } = await getProperties(filters);

          if (error) {
            set({ isLoading: false, error: 'Erro ao carregar imoveis' });
            return;
          }

          set({
            properties: reset ? newProperties : [...properties, ...newProperties],
            isLoading: false,
            hasMore: newProperties.length === ITEMS_PER_PAGE,
            page: currentPage + 1,
          });
        } catch (err: any) {
          console.error('Fetch properties error:', err);
          set({ isLoading: false, error: err.message || 'Erro ao carregar imoveis' });
        }
      },

      fetchFeatured: async () => {
        try {
          set({ isLoading: true, error: null });

          const { properties, error } = await getFeaturedProperties(5);

          if (error) {
            set({ isLoading: false, error: 'Erro ao carregar destaques' });
            return;
          }

          set({
            featuredProperties: properties,
            isLoading: false,
          });
        } catch (err: any) {
          console.error('Fetch featured error:', err);
          set({ isLoading: false, error: err.message || 'Erro ao carregar destaques' });
        }
      },

      setFilter: async (filter: PropertyFilter) => {
        const { activeFilter } = get();
        if (filter === activeFilter) return;

        set({
          activeFilter: filter,
          page: 0,
          hasMore: true,
          properties: [],
        });

        const { fetchProperties } = get();
        await fetchProperties(true);
      },

      searchPropertiesAction: async (query: string) => {
        try {
          if (!query.trim()) {
            set({ searchQuery: '', isSearching: false });
            const { fetchProperties } = get();
            await fetchProperties(true);
            return;
          }

          set({ isSearching: true, error: null, searchQuery: query });

          const { properties, error } = await searchProperties(query);

          if (error) {
            set({ isSearching: false, error: 'Erro na pesquisa' });
            return;
          }

          set({
            properties,
            isSearching: false,
            hasMore: false,
          });
        } catch (err: any) {
          console.error('Search properties error:', err);
          set({ isSearching: false, error: err.message || 'Erro na pesquisa' });
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      toggleFavorite: (propertyId: string) => {
        set((state) => ({
          favorites: state.favorites.includes(propertyId)
            ? state.favorites.filter((id) => id !== propertyId)
            : [...state.favorites, propertyId],
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          properties: [],
          featuredProperties: [],
          isLoading: false,
          isSearching: false,
          error: null,
          activeFilter: 'all',
          searchQuery: '',
          hasMore: true,
          page: 0,
        });
      },
    }),
    {
      name: 'kugava-properties-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        activeFilter: state.activeFilter,
      }),
    }
  )
);

export const selectProperties = (state: PropertiesState) => state.properties;
export const selectFeaturedProperties = (state: PropertiesState) => state.featuredProperties;
export const selectActiveFilter = (state: PropertiesState) => state.activeFilter;
export const selectFavorites = (state: PropertiesState) => state.favorites;
export const selectIsLoading = (state: PropertiesState) => state.isLoading;
export const selectIsSearching = (state: PropertiesState) => state.isSearching;
export const selectSearchQuery = (state: PropertiesState) => state.searchQuery;
