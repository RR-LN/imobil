import { supabase, Profile } from './supabase';

/**
 * Sign up a new user
 */
export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  referralCode?: string
) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create profile - novo user e comprador por default (pode virar vendedor/affiliate depois)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      phone: phone || null,
      is_seller: false,
      is_affiliate: false,
    });

    if (profileError) throw profileError;

    // If referral code provided, create referral record
    let referralResult = null;
    if (referralCode) {
      // Find affiliate by referral code
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (affiliateData) {
        // Create referral record
        const { data: referralData, error: referralError } = await supabase
          .from('referrals')
          .insert({
            affiliate_id: affiliateData.id,
            referred_user_id: authData.user.id,
            status: 'pending',
            commission_amount: 200, // Registration bonus
          })
          .select()
          .single();

        if (referralError) {
          console.error('Erro ao criar referral:', referralError);
        } else {
          referralResult = referralData;
        }
      }
    }

    return {
      user: authData.user,
      error: null,
      referral: referralResult,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { user: null, error, referral: null };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error };
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error: any) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { user: null, error };
  }
};

/**
 * Get user profile
 */
export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { profile: data as Profile, error: null };
  } catch (error: any) {
    console.error('Get profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'phone'>>
) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return { error };
  }
};

/**
 * Enable seller mode for user
 */
export const becomeSeller = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ is_seller: true })
      .eq('id', user.id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Become seller error:', error);
    return { error };
  }
};

/**
 * Enable affiliate mode for user
 */
export const becomeAffiliate = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_affiliate: true })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Check if affiliate record exists
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingAffiliate) {
      // Generate unique referral code
      const referralCode = await generateReferralCode(user.id);

      // Create affiliate record
      const { error: affiliateError } = await supabase.from('affiliates').insert({
        id: user.id,
        referral_code: referralCode,
        level: 'bronze',
        total_earnings: 0,
      });

      if (affiliateError) throw affiliateError;
    }

    return { error: null };
  } catch (error: any) {
    console.error('Become affiliate error:', error);
    return { error };
  }
};

/**
 * Generate unique referral code - simplified frontend version
 * (backend has the actual SQL function)
 */
const generateReferralCode = (userId: string): string => {
  const prefix = 'K';
  const idPart = userId.replace(/-/g, '').substring(0, 6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${idPart}${randomPart}`;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (
  callback: (user: any) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      callback(session?.user || null);
    }
  );
  return subscription;
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'kugava://reset-password',
    });
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { error };
  }
};
