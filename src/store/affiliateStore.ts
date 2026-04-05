import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Clipboard from 'expo-clipboard';
import {
  getOrCreateAffiliate,
  getAffiliateStats,
  getReferralHistory,
  generateReferralLink,
  getReferralLink as getReferralLinkURL,
  trackReferralClick,
} from '../services/affiliateService';
import { getCurrentUser } from '../services/authService';

export type AffiliateLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Referral {
  id: string;
  referred_user_id: string;
  property_id: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  commission_amount: number | null;
  created_at: string;
  referred_user?: {
    full_name: string;
    avatar_url: string | null;
  };
  property?: {
    title: string;
    price: number;
  };
}

export interface AffiliateStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  conversions: number;
  conversionRate: number;
  level: AffiliateLevel;
  referralCode: string | null;
}

interface AffiliateState {
  stats: AffiliateStats | null;
  referrals: Referral[];
  referralCode: string | null;
  earnings: number;
  level: AffiliateLevel;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchReferrals: () => Promise<void>;
  copyReferralLink: () => Promise<string>;
  trackReferral: (code: string) => Promise<void>;
  generateReferralCode: () => Promise<string | null>;
  reset: () => void;
}

const STORAGE_KEY = 'imobil_referral_code';

export const useAffiliateStore = create<AffiliateState>()(
  persist(
    (set, get) => ({
      stats: null,
      referrals: [],
      referralCode: null,
      earnings: 0,
      level: 'bronze',
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          const { user, error: userError } = await getCurrentUser();
          if (userError || !user) {
            set({ isLoading: false, isInitialized: true });
            return;
          }

          const fullName = user.user_metadata?.full_name || 'User';

          const { affiliate, error } = await getOrCreateAffiliate(user.id, fullName);

          if (error) {
            set({
              isLoading: false,
              isInitialized: true,
              error: 'Erro ao carregar dados de afiliado'
            });
            return;
          }

          if (affiliate) {
            set({
              referralCode: affiliate.referral_code,
              level: affiliate.level as AffiliateLevel,
              earnings: affiliate.total_earnings,
              isInitialized: true,
            });
          }

          await get().fetchStats();
          await get().fetchReferrals();

          set({ isLoading: false });
        } catch (err: any) {
          console.error('Initialize affiliate error:', err);
          set({
            isLoading: false,
            isInitialized: true,
            error: err.message || 'Erro ao inicializar afiliado',
          });
        }
      },

      fetchStats: async () => {
        try {
          set({ isLoading: true, error: null });

          const { user } = await getCurrentUser();
          if (!user) {
            set({ isLoading: false, error: 'Utilizador não autenticado' });
            return;
          }

          const { stats, error } = await getAffiliateStats(user.id);

          if (error) {
            set({
              isLoading: false,
              error: error.message || 'Erro ao buscar estatísticas',
              stats: null,
            });
            return;
          }

          set({
            stats,
            referralCode: stats?.referralCode || null,
            earnings: stats?.totalEarnings || 0,
            level: (stats?.level as AffiliateLevel) || 'bronze',
            isLoading: false,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Erro ao buscar estatísticas',
          });
        }
      },

      fetchReferrals: async () => {
        try {
          const { user } = await getCurrentUser();
          if (!user) {
            set({ error: 'Utilizador não autenticado' });
            return;
          }

          const { referrals, error } = await getReferralHistory(user.id, 10);

          if (error) {
            set({ error: error.message || 'Erro ao buscar referrals' });
            return;
          }

          set({ referrals: referrals || [] });
        } catch (err: any) {
          set({ error: err.message || 'Erro ao buscar referrals' });
        }
      },

      copyReferralLink: async () => {
        const { referralCode } = get();

        if (!referralCode) {
          throw new Error('Código de referral não gerado');
        }

        const link = getReferralLinkURL(referralCode);

        await Clipboard.setStringAsync(link);

        return link;
      },

      trackReferral: async (code: string) => {
        try {
          const { user } = await getCurrentUser();
          await trackReferralClick(code, user?.id);
        } catch (err: any) {
          console.error('Erro ao trackar referral:', err);
        }
      },

      generateReferralCode: async () => {
        try {
          const { user } = await getCurrentUser();
          if (!user) {
            throw new Error('Utilizador não autenticado');
          }

          const { referralCode, error } = await generateReferralLink(user.id);

          if (error) {
            throw error;
          }

          set({ referralCode });
          return referralCode;
        } catch (err: any) {
          set({ error: err.message || 'Erro ao gerar código de referral' });
          return null;
        }
      },

      reset: () => {
        set({
          stats: null,
          referrals: [],
          referralCode: null,
          earnings: 0,
          level: 'bronze',
          isLoading: false,
          isInitialized: false,
          error: null,
        });
      },
    }),
    {
      name: 'kugava-affiliate-storage',
      partialize: (state) => ({
        referralCode: state.referralCode,
        earnings: state.earnings,
        level: state.level,
      }),
    }
  )
);

export const selectAffiliateStats = (state: AffiliateState) => state.stats;
export const selectReferralCode = (state: AffiliateState) => state.referralCode;
export const selectAffiliateLevel = (state: AffiliateState) => state.level;
export const selectAffiliateEarnings = (state: AffiliateState) => state.earnings;
export const selectReferrals = (state: AffiliateState) => state.referrals;
export const selectAffiliateLoading = (state: AffiliateState) => state.isLoading;
