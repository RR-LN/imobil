import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const error = useAuthStore((s) => s.error);

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const becomeSeller = useAuthStore((s) => s.becomeSeller);
  const becomeAffiliate = useAuthStore((s) => s.becomeAffiliate);
  const clearError = useAuthStore((s) => s.clearError);
  const loadSession = useAuthStore((s) => s.loadSession);

  return {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    becomeSeller,
    becomeAffiliate,
    clearError,
    loadSession,
  };
}
