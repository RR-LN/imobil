import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ToastProvider, useToast } from '../components/Toast';

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineTime: Date | null;
}

interface OfflineContextType extends OfflineState {
  checkConnection: () => Promise<boolean>;
  showOfflineMessage: () => void;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isOffline: false,
  lastOnlineTime: null,
  checkConnection: async () => true,
  showOfflineMessage: () => {},
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isOffline: false,
    lastOnlineTime: null,
  });
  const { showError } = useToast();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isOnline = netState.isConnected && netState.isInternetReachable !== false;
      setState(prev => ({
        isOnline: isOnline ?? false,
        isOffline: !(isOnline ?? true),
        lastOnlineTime: isOnline ? new Date() : prev.lastOnlineTime,
      }));

      if (!isOnline) {
        showError('Sem conexão à internet. Algumas funcionalidades podem estar limitadas.');
      }
    });

    return () => unsubscribe();
  }, [showError]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable !== false;
    
    if (!isOnline) {
      showError('Verifique sua conexão à internet e tente novamente.');
    }
    
    return isOnline ?? false;
  }, [showError]);

  const showOfflineMessage = useCallback(() => {
    showError('Esta funcionalidade requer conexão à internet.');
  }, [showError]);

  return (
    <OfflineContext.Provider value={{ ...state, checkConnection, showOfflineMessage }}>
      {children}
    </OfflineContext.Provider>
  );
};
