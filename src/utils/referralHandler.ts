import { Linking, Platform } from 'react-native';
import { storage } from './storage';

const REFERRAL_STORAGE_KEY = 'imobil_pending_referral';
const HAS_REFERRAL_KEY = 'imobil_has_referral';

const isWeb = Platform.OS === 'web';

/**
 * Check if the app was opened with a referral link
 * Returns the referral code if found
 */
export const checkForReferralLink = async (): Promise<string | null> => {
  try {
    let initialUrl: string | null = null;
    
    if (isWeb) {
      // On web, use window.location
      initialUrl = window.location.href;
    } else {
      // On native, use Linking
      initialUrl = await Linking.getInitialURL();
    }

    if (initialUrl) {
      const code = extractReferralCode(initialUrl);
      if (code) {
        return code;
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao verificar referral link:', error);
    return null;
  }
};

/**
 * Listen for referral links while app is open
 */
export const listenForReferralLinks = (
  onReferralReceived: (code: string) => void
) => {
  if (isWeb) {
    // On web, listen for popstate/hashchange events
    const handleUrlChange = () => {
      const code = extractReferralCode(window.location.href);
      if (code) {
        onReferralReceived(code);
      }
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    
    return {
      remove: () => {
        window.removeEventListener('popstate', handleUrlChange);
        window.removeEventListener('hashchange', handleUrlChange);
      }
    };
  }

  const subscription = Linking.addEventListener('url', async ({ url }) => {
    const code = extractReferralCode(url);
    if (code) {
      onReferralReceived(code);
    }
  });

  return subscription;
};

/**
 * Extract referral code from URL
 * Supports formats:
 * - imobil://ref/CODE
 * - imobil://?ref=CODE
 * - https://imobil.mz/ref/CODE
 * - https://imobil.mz/?ref=CODE
 */
export const extractReferralCode = (url: string): string | null => {
  try {
    // Remove protocol and path
    const cleanUrl = url.replace(/^(https?:\/\/|imobil:\/\/)/, '');

    // Try to match /ref/CODE pattern
    const match1 = cleanUrl.match(/ref\/([A-Z0-9]+)/i);
    if (match1?.[1]) {
      return match1[1];
    }

    // Try to match ?ref=CODE pattern
    const urlObj = new URL(url);
    const refParam = urlObj.searchParams.get('ref');
    if (refParam) {
      return refParam;
    }

    return null;
  } catch (error) {
    console.error('Erro ao extrair referral code:', error);
    return null;
  }
};

/**
 * Save referral code for later use (when user registers)
 */
export const savePendingReferral = async (referralCode: string): Promise<void> => {
  try {
    // Check if user already has an account
    const hasAccount = await storage.getItem(HAS_REFERRAL_KEY);
    if (hasAccount) {
      return;
    }

    await storage.setItem(REFERRAL_STORAGE_KEY, referralCode);
  } catch (error) {
    console.error('Erro ao guardar referral code:', error);
  }
};

/**
 * Get saved referral code
 */
export const getPendingReferral = async (): Promise<string | null> => {
  try {
    return await storage.getItem(REFERRAL_STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao ler referral code:', error);
    return null;
  }
};

/**
 * Clear saved referral code after use
 */
export const clearPendingReferral = async (): Promise<void> => {
  try {
    await storage.removeItem(REFERRAL_STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar referral code:', error);
  }
};

/**
 * Check if user was referred (has used a referral code before)
 */
export const hasBeenReferred = async (): Promise<boolean> => {
  try {
    const hasReferral = await storage.getItem(HAS_REFERRAL_KEY);
    return hasReferral === 'true';
  } catch (error) {
    console.error('Erro ao verificar se utilizador foi referido:', error);
    return false;
  }
};

/**
 * Mark that user has been referred (used a referral code)
 */
export const markAsReferred = async (): Promise<void> => {
  try {
    await storage.setItem(HAS_REFERRAL_KEY, 'true');
  } catch (error) {
    console.error('Erro ao marcar utilizador como referido:', error);
  }
};

/**
 * Initialize referral system on app start
 * - Check for referral link in URL
 * - Save it if user is not logged in
 */
export const initializeReferralSystem = async (): Promise<{
  hasReferral: boolean;
  referralCode: string | null;
}> => {
  try {
    // Check if app was opened with referral link
    const referralCode = await checkForReferralLink();

    if (referralCode) {
      await savePendingReferral(referralCode);
      return { hasReferral: true, referralCode };
    }

    return { hasReferral: false, referralCode: null };
  } catch (error) {
    console.error('Erro ao inicializar sistema de referrals:', error);
    return { hasReferral: false, referralCode: null };
  }
};

/**
 * Get referral link from deep link
 */
export const getReferralLinkFromUrl = (url: string): string | null => {
  return extractReferralCode(url);
};
