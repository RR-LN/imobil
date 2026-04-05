import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../services/supabase';
import {
  signIn as signInService,
  signUp as signUpService,
  signOut as signOutService,
  becomeSeller,
  becomeAffiliate,
  getProfile
} from '../services/authService';
import { notificationService } from '../services/notificationService';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  loadSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    referralCode?: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  becomeSeller: () => Promise<{ error: any }>;
  becomeAffiliate: () => Promise<{ error: any }>;
  clearError: () => void;
}

interface PersistedAuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      loadSession: async () => {
        try {
          set({ isLoading: true, error: null });

          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            set({ isLoading: false, error: sessionError.message });
            return;
          }

          if (session?.user) {
            const { profile } = await getProfile(session.user.id);

            set({
              user: session.user,
              session,
              profile,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }

          supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession?.user) {
                const { profile } = await getProfile(newSession.user.id);
                set({
                  user: newSession.user,
                  session: newSession,
                  profile,
                  isAuthenticated: true,
                  isLoading: false,
                });
                await notificationService.registerForPushNotifications();
              } else if (event === 'SIGNED_OUT') {
                set({
                  user: null,
                  session: null,
                  profile: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              } else if (event === 'TOKEN_REFRESHED' && newSession) {
                set({ session: newSession });
              }
            }
          );
        } catch (err: any) {
          console.error('Error loading session:', err);
          set({
            isLoading: false,
            error: err.message || 'Erro ao carregar sessao',
          });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const { user, session, error } = await signInService(email, password);

          if (error) {
            set({ isLoading: false, error: error.message });
            return { error };
          }

          if (user && session) {
            const { profile } = await getProfile(user.id);
            set({
              user,
              session,
              profile,
              isAuthenticated: true,
              isLoading: false,
            });

            await notificationService.registerForPushNotifications();
          }

          return { error: null };
        } catch (err: any) {
          console.error('Sign in error:', err);
          set({ isLoading: false, error: err.message });
          return { error: err };
        }
      },

      signUp: async (email, password, fullName, phone, referralCode) => {
        try {
          set({ isLoading: true, error: null });

          const { user, error } = await signUpService(
            email,
            password,
            fullName,
            phone,
            referralCode
          );

          if (error) {
            set({ isLoading: false, error: error.message });
            return { error };
          }

          set({ isLoading: false });

          return { error: null };
        } catch (err: any) {
          console.error('Sign up error:', err);
          set({ isLoading: false, error: err.message });
          return { error: err };
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });

          const { error } = await signOutService();

          if (error) {
            console.error('Sign out error:', error);
          }

          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          console.error('Sign out error:', err);
          set({ isLoading: false, error: err.message });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        try {
          const { user } = get();
          if (!user) return;

          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) throw error;

          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
          }));
        } catch (err: any) {
          console.error('Update profile error:', err);
          set({ error: err.message });
        }
      },

      becomeSeller: async () => {
        try {
          set({ isLoading: true, error: null });

          const { error } = await becomeSeller();

          if (error) {
            set({ isLoading: false, error: error.message });
            return { error };
          }

          set((state) => ({
            profile: state.profile ? { ...state.profile, is_seller: true } : null,
            isLoading: false,
          }));

          return { error: null };
        } catch (err: any) {
          console.error('Become seller error:', err);
          set({ isLoading: false, error: err.message });
          return { error: err };
        }
      },

      becomeAffiliate: async () => {
        try {
          set({ isLoading: true, error: null });

          const { error } = await becomeAffiliate();

          if (error) {
            set({ isLoading: false, error: error.message });
            return { error };
          }

          set((state) => ({
            profile: state.profile ? { ...state.profile, is_affiliate: true } : null,
            isLoading: false,
          }));

          return { error: null };
        } catch (err: any) {
          console.error('Become affiliate error:', err);
          set({ isLoading: false, error: err.message });
          return { error: err };
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'kugava-auth-storage',
    }
  )
);

export const selectUser = (state: AuthState) => state.user;
export const selectProfile = (state: AuthState) => state.profile;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAuthLoading = (state: AuthState) => state.isLoading;
export const selectAuthError = (state: AuthState) => state.error;
