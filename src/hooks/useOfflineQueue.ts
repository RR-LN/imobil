import { useState, useCallback, useRef, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = 'kugava-offline-queue';

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

interface OfflineQueueState {
  isOnline: boolean;
  queue: QueuedAction[];
  isSyncing: boolean;
}

export function useOfflineQueue() {
  const [state, setState] = useState<OfflineQueueState>({
    isOnline: true,
    queue: [],
    isSyncing: false,
  });

  const syncFn = useRef<((action: QueuedAction) => Promise<boolean>) | null>(null);

  useEffect(() => {
    loadQueue();

    const unsubscribe = NetInfo.addEventListener((netState) => {
      const isOnline = !!netState.isConnected && netState.isInternetReachable !== false;
      setState((prev) => ({ ...prev, isOnline }));
      if (isOnline) {
        syncQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadQueue = async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw) {
        const queue: QueuedAction[] = JSON.parse(raw);
        setState((prev) => ({ ...prev, queue }));
      }
    } catch {
      // ignore
    }
  };

  const saveQueue = async (queue: QueuedAction[]) => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  };

  const enqueue = useCallback((type: string, payload: unknown) => {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    setState((prev) => {
      const newQueue = [...prev.queue, action];
      saveQueue(newQueue);
      return { ...prev, queue: newQueue };
    });

    return action.id;
  }, []);

  const syncQueue = useCallback(async () => {
    if (!syncFn.current) return;

    setState((prev) => {
      if (prev.isSyncing || prev.queue.length === 0) return prev;
      return { ...prev, isSyncing: true };
    });

    const remaining: QueuedAction[] = [];

    for (const action of state.queue) {
      if (action.retries >= 3) continue;

      try {
        const success = await syncFn.current(action);
        if (!success) {
          remaining.push({ ...action, retries: action.retries + 1 });
        }
      } catch {
        remaining.push({ ...action, retries: action.retries + 1 });
      }
    }

    setState((prev) => {
      saveQueue(remaining);
      return { ...prev, queue: remaining, isSyncing: false };
    });
  }, [state.queue]);

  const setSyncFn = useCallback((fn: (action: QueuedAction) => Promise<boolean>) => {
    syncFn.current = fn;
  }, []);

  const clearQueue = useCallback(async () => {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    setState((prev) => ({ ...prev, queue: [] }));
  }, []);

  return {
    isOnline: state.isOnline,
    queue: state.queue,
    isSyncing: state.isSyncing,
    enqueue,
    syncQueue,
    setSyncFn,
    clearQueue,
  };
}
