import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryErrorResetBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </QueryErrorResetBoundary>
  );
};

export { queryClient };
