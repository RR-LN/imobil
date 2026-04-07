import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useFavoritesStore, subscribeToFavorites } from '../store/favoritesStore';

/**
 * Hook to sync favorites with cloud and subscribe to realtime changes
 * Use this in App.tsx or a high-level component
 */
export function useFavoritesSubscription() {
  const { user, isAuthenticated } = useAuthStore();
  const { syncWithCloud } = useFavoritesStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial sync
    syncWithCloud();

    // Subscribe to realtime changes
    const unsubscribe = subscribeToFavorites();

    return () => {
      unsubscribe?.();
    };
  }, [isAuthenticated, user, syncWithCloud]);
}
