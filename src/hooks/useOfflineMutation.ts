import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOffline } from '../providers/OfflineProvider';
import { useToast } from '../components/Toast';

interface OfflineMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: Error | null }>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  successMessage?: string;
}

export function useOfflineMutation<TData, TVariables>(
  options: OfflineMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { checkConnection, showOfflineMessage } = useOffline();
  const { showError, showSuccess } = useToast();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const isOnline = await checkConnection();
      if (!isOnline) {
        throw new Error('OFFLINE');
      }

      const result = await options.mutationFn(variables);
      if (result.error) {
        throw result.error;
      }
      return result.data as TData;
    },
    onError: (error: Error, variables: TVariables) => {
      if (error.message === 'OFFLINE') {
        showOfflineMessage();
      } else {
        showError(error.message || 'Ocorreu um erro. Tente novamente.');
      }
      options.onError?.(error, variables);
    },
    onSuccess: (data: TData, variables: TVariables) => {
      queryClient.invalidateQueries();
      if (options.successMessage) {
        showSuccess(options.successMessage);
      }
      options.onSuccess?.(data, variables);
    },
  });
}

interface OfflineQueryOptions<TData> {
  queryKey: unknown[];
  queryFn: () => Promise<{ data: TData | null; error: Error | null }>;
  enabled?: boolean;
  staleTime?: number;
}

export function useOfflineQuery<TData>(options: OfflineQueryOptions<TData>) {
  const { isOffline } = useOffline();

  return useQuery<TData, Error>({
    queryKey: options.queryKey,
    queryFn: async () => {
      const result = await options.queryFn();
      if (result.error) {
        throw result.error;
      }
      return result.data as TData;
    },
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    retry: isOffline ? false : 3,
  });
}
