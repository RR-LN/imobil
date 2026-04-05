import { useState, useEffect } from 'react';
import { getPendingReferral, clearPendingReferral, hasBeenReferred } from '../utils/referralHandler';
import { useAffiliateStore } from '../store/affiliateStore';

/**
 * Hook para gerir referral code no registo
 * 
 * @returns Objeto com estado do referral code e funções
 */
export const useReferralCode = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);

  // Carregar referral code guardado
  useEffect(() => {
    const loadReferralCode = async () => {
      try {
        const code = await getPendingReferral();
        const hasReferred = await hasBeenReferred();
        
        setReferralCode(code);
        setHasUsedReferral(hasReferred);
      } catch (error) {
        console.error('Erro ao carregar referral code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferralCode();
  }, []);

  // Limpar referral code após uso
  const clearCode = async () => {
    await clearPendingReferral();
    setReferralCode(null);
  };

  return {
    referralCode,
    isLoading,
    hasUsedReferral,
    hasReferral: !!referralCode && !hasUsedReferral,
    clearCode,
  };
};

/**
 * Hook para verificar se utilizador tem pending referral
 */
export const usePendingReferral = () => {
  const [pendingReferral, setPendingReferral] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const code = await getPendingReferral();
        setPendingReferral(code);
      } catch (error) {
        console.error('Erro ao verificar pending referral:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPending();
  }, []);

  return { pendingReferral, isLoading };
};

/**
 * Hook para estatísticas de afiliado
 */
export const useAffiliateStats = () => {
  const { stats, fetchStats, isLoading, error, fetchReferrals, referrals } = useAffiliateStore();

  useEffect(() => {
    fetchStats();
    fetchReferrals();
  }, [fetchStats, fetchReferrals]);

  return {
    stats,
    referrals,
    isLoading,
    error,
    refresh: () => {
      fetchStats();
      fetchReferrals();
    },
  };
};
