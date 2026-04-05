import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAffiliateStats,
  getReferralHistory,
  generateReferralLink,
  trackReferralClick,
} from '../services/affiliateService';
import { queryKeys } from './useQuery';

// Hook for affiliate stats with cache
export const useAffiliateStats = (userId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.affiliate.stats(),
    queryFn: async () => {
      if (!userId) return null;
      const { stats, error } = await getAffiliateStats(userId);
      if (error) throw error;
      return stats;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for referral history with cache
export const useReferralHistory = (userId: string | undefined, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.affiliate.referrals(),
    queryFn: async () => {
      if (!userId) return [];
      const { referrals, error } = await getReferralHistory(userId, limit);
      if (error) throw error;
      return referrals;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

// Hook for affiliate actions
export const useAffiliateActions = () => {
  const queryClient = useQueryClient();

  const generateCode = useMutation({
    mutationFn: async (userId: string) => {
      const { referralCode, error } = await generateReferralLink(userId);
      if (error) throw error;
      return referralCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.affiliate.all });
    },
  });

  const trackClick = useMutation({
    mutationFn: async ({ code, userId }: { code: string; userId?: string }) => {
      const { error } = await trackReferralClick(code, userId);
      if (error) throw error;
    },
  });

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.affiliate.stats() });
  };

  const refreshReferrals = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.affiliate.referrals() });
  };

  return {
    generateCode,
    trackClick,
    refreshStats,
    refreshReferrals,
  };
};
