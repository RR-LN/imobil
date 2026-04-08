import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';

export type SocialProvider = 'google' | 'apple';

/**
 * Perform social authentication using Supabase OAuth
 */
export const signInWithSocial = async (provider: SocialProvider) => {
  try {
    // Deep link scheme
    const redirectTo = 'kugava://callback';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    
    if (data?.url) {
      // Open in browser and wait for result
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      
      if (result.type === 'success') {
        // Get the current session after browser returns
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        return { user: sessionData.session?.user || null, error: null };
      }
    }
    
    return { user: null, error: new Error('Authentication cancelled') };
  } catch (error: any) {
    console.error(`${provider} sign in error:`, error);
    return { user: null, error };
  }
};

/**
 * Sign in with Google (for development - web fallback)
 */
export const signInWithGoogle = () => signInWithSocial('google');

/**
 * Sign in with Apple (for development - web fallback)
 */
export const signInWithApple = () => signInWithSocial('apple');

/**
 * Listen for auth state changes
 */
export const listenForAuthChanges = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      callback(session.user);
    }
  });
};

/**
 * Complete profile after social login
 */
export const completeSocialProfile = async (
  userId: string,
  fullName: string,
  phone?: string
) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Complete profile error:', error);
    return { error };
  }
};

/**
 * Check if user needs to complete profile
 */
export const checkProfileStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    const needsCompletion = !data?.full_name || !data?.phone;
    return { needsCompletion, profile: data, error: null };
  } catch (error: any) {
    console.error('Check profile error:', error);
    return { needsCompletion: true, profile: null, error };
  }
};

// Close browser on start
WebBrowser.maybeCompleteAuthSession();
