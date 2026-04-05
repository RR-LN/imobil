import { supabase, Affiliate, Referral } from './supabase';
import { notificationService } from './notificationService';
import { 
  calculateCommission, 
  calculateRegistrationBonus,
  formatCommission,
  getCommissionTypeByRole 
} from '../utils/commission';

// Level thresholds based on conversions
const LEVEL_THRESHOLDS = {
  bronze: { min: 0, max: 5 },
  silver: { min: 6, max: 15 },
  gold: { min: 16, max: 30 },
  platinum: { min: 31, max: Infinity },
};

/**
 * Generate unique referral code
 * Format: 'KG' + first 6 letters of name + random number
 */
const generateUniqueReferralCode = async (userId: string, fullName: string): Promise<string> => {
  // Get first 6 letters of name (cleaned)
  const cleanName = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePart = cleanName.substring(0, 6).padEnd(6, 'X');
  
  // Generate random 3-digit number
  const randomNum = Math.floor(Math.random() * 900) + 100;
  
  const code = `KG${namePart}${randomNum}`;
  
  // Check if code already exists
  const { data: existing } = await supabase
    .from('affiliates')
    .select('referral_code')
    .eq('referral_code', code)
    .single();
  
  if (existing) {
    // Recursively generate new code if collision
    return generateUniqueReferralCode(userId, fullName);
  }
  
  return code;
};

/**
 * Get or create affiliate record for user
 */
export const getOrCreateAffiliate = async (
  userId: string, 
  fullName: string
): Promise<{ affiliate: Affiliate | null; error: any }> => {
  try {
    // Check if affiliate record exists
    const { data: existing, error: fetchError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existing) {
      return { affiliate: existing as Affiliate, error: null };
    }
    
    // Create new affiliate record
    const referralCode = await generateUniqueReferralCode(userId, fullName);
    
    const { data: newAffiliate, error: createError } = await supabase
      .from('affiliates')
      .insert({
        id: userId,
        referral_code: referralCode,
        level: 'bronze',
        total_earnings: 0,
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    return { affiliate: newAffiliate as Affiliate, error: null };
  } catch (error: any) {
    console.error('Get or create affiliate error:', error);
    return { affiliate: null, error };
  }
};

/**
 * Get affiliate stats with real data
 */
export const getAffiliateStats = async (userId: string) => {
  try {
    // Get affiliate record
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', userId)
      .single();

    if (affiliateError && affiliateError.code !== 'PGRST116') {
      throw affiliateError;
    }

    // Get all referrals for this affiliate
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('affiliate_id', userId);

    if (referralsError) throw referralsError;

    const allReferrals = referrals || [];
    
    // Calculate stats
    const totalReferrals = allReferrals.length;
    const completedReferrals = allReferrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = allReferrals.filter(r => r.status === 'pending').length;
    
    // Total earnings from completed referrals
    const totalEarnings = allReferrals
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0);
    
    // Monthly earnings (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = allReferrals
      .filter(r => 
        r.status === 'completed' && 
        new Date(r.created_at) >= startOfMonth
      )
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0);
    
    // Conversion rate
    const conversionRate = totalReferrals > 0 
      ? (completedReferrals / totalReferrals) * 100 
      : 0;
    
    // Determine level based on conversions
    const level = determineAffiliateLevel(completedReferrals);

    return {
      stats: {
        totalEarnings,
        monthlyEarnings,
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        conversions: completedReferrals,
        conversionRate,
        level: level as 'bronze' | 'silver' | 'gold' | 'platinum',
        referralCode: affiliate?.referral_code || null,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Get affiliate stats error:', error);
    return { stats: null, error };
  }
};

/**
 * Determine affiliate level based on conversions
 */
const determineAffiliateLevel = (conversions: number): string => {
  if (conversions >= 31) return 'platinum';
  if (conversions >= 16) return 'gold';
  if (conversions >= 6) return 'silver';
  return 'bronze';
};

/**
 * Get referral history for affiliate
 */
export const getReferralHistory = async (
  affiliateId: string, 
  limit: number = 10
): Promise<{ referrals: any[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:profiles!referrals_referred_user_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        property:properties (
          id,
          title,
          price
        )
      `)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { referrals: data || [], error: null };
  } catch (error: any) {
    console.error('Get referral history error:', error);
    return { referrals: [], error };
  }
};

/**
 * Update affiliate level based on conversions
 */
export const updateAffiliateLevel = async (
  affiliateId: string
): Promise<{ level: string | null; error: any }> => {
  try {
    // Get current conversions count
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliateId)
      .eq('status', 'completed');

    const conversions = referrals?.length || 0;
    const newLevel = determineAffiliateLevel(conversions);

    // Update level in database
    const { error } = await supabase
      .from('affiliates')
      .update({ level: newLevel })
      .eq('id', affiliateId);

    if (error) throw error;

    return { level: newLevel, error: null };
  } catch (error: any) {
    console.error('Update affiliate level error:', error);
    return { level: null, error };
  }
};

/**
 * Process referral commission when booking is confirmed
 * This is called by the Edge Function
 */
export const processReferralCommission = async (
  bookingId: string,
  buyerId: string,
  propertyId: string,
  propertyValue: number
): Promise<{ success: boolean; error: any }> => {
  try {
    // Check if buyer came from a referral
    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', buyerId)
      .single();

    if (!profile?.referred_by) {
      // No referral, nothing to process
      return { success: true, error: null };
    }

    // Get the affiliate record
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('id', profile.referred_by)
      .single();

    if (!affiliate) {
      return { success: true, error: null };
    }

    // Get the user's role to determine commission type
    const { data: referrer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', affiliate.id)
      .single();

    const commissionType = getCommissionTypeByRole(referrer?.role || 'user');
    
    // Calculate commission
    const commission = calculateCommission(propertyValue, commissionType);
    const bonusAmount = calculateRegistrationBonus();
    const totalCommission = commission.finalAmount + bonusAmount;

    // Check if referral record exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('referred_user_id', buyerId)
      .single();

    if (existingReferral) {
      // Update existing referral
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'completed',
          commission_amount: totalCommission,
          property_id: propertyId,
        })
        .eq('id', existingReferral.id);

      if (updateError) throw updateError;
    } else {
      // Create new referral record
      const { error: createError } = await supabase
        .from('referrals')
        .insert({
          affiliate_id: affiliate.id,
          referred_user_id: buyerId,
          property_id: propertyId,
          status: 'completed',
          commission_amount: totalCommission,
        });

      if (createError) throw createError;
    }

    // Update affiliate total earnings
    await supabase.rpc('update_affiliate_earnings', {
      affiliate_id: affiliate.id,
      amount: totalCommission,
    });

    // Update affiliate level
    await updateAffiliateLevel(affiliate.id);

    // Send notification
    try {
      await notificationService.schedulePushNotification(
        'Nova comissão!',
        `Ganhaste ${formatCommission(totalCommission)} por uma indicação convertida!`,
        { type: 'affiliate' }
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Process referral commission error:', error);
    return { success: false, error };
  }
};

/**
 * Track referral click
 */
export const trackReferralClick = async (
  referralCode: string, 
  userId?: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('referral_clicks')
      .insert({
        referral_code: referralCode,
        user_id: userId || null,
        clicked_at: new Date().toISOString(),
      });

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Track referral click error:', error);
    return { error };
  }
};

/**
 * Generate referral link
 */
export const generateReferralLink = async (userId: string) => {
  try {
    // Check if affiliate record exists
    const { data: existing } = await supabase
      .from('affiliates')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (existing?.referral_code) {
      return { referralCode: existing.referral_code, error: null };
    }

    // Get user's name for code generation
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const fullName = profile?.full_name || 'User';

    // Generate unique referral code
    const referralCode = await generateUniqueReferralCode(userId, fullName);

    // Create affiliate record
    const { error } = await supabase
      .from('affiliates')
      .upsert({
        id: userId,
        referral_code: referralCode,
        level: 'bronze',
        total_earnings: 0,
      });

    if (error) throw error;

    return { referralCode, error: null };
  } catch (error: any) {
    console.error('Generate referral link error:', error);
    return { referralCode: null, error };
  }
};

/**
 * Get referral link URL
 */
export const getReferralLink = (referralCode: string): string => {
  return `https://imobil.mz/ref/${referralCode}`;
};

/**
 * Create a referral
 */
export const createReferral = async (
  affiliateId: string,
  referredUserId: string,
  propertyId?: string,
  commissionAmount?: number
) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        affiliate_id: affiliateId,
        referred_user_id: referredUserId,
        property_id: propertyId || null,
        status: 'pending',
        commission_amount: commissionAmount || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { referral: data as Referral, error: null };
  } catch (error: any) {
    console.error('Create referral error:', error);
    return { referral: null, error };
  }
};

/**
 * Update referral status
 */
export const updateReferralStatus = async (
  referralId: string,
  status: 'pending' | 'completed' | 'cancelled',
  commissionAmount?: number
) => {
  try {
    const { error } = await supabase
      .from('referrals')
      .update({
        status,
        commission_amount: commissionAmount !== undefined ? commissionAmount : undefined,
      })
      .eq('id', referralId);

    if (error) throw error;

    // If completed, update affiliate total earnings and send notification
    if (status === 'completed' && commissionAmount) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('affiliate_id')
        .eq('id', referralId)
        .single();

      if (referral) {
        await supabase.rpc('update_affiliate_earnings', {
          affiliate_id: referral.affiliate_id,
          amount: commissionAmount,
        });

        // Update affiliate level
        await updateAffiliateLevel(referral.affiliate_id);

        // Send push notification for affiliate conversion
        try {
          const formattedAmount = new Intl.NumberFormat('pt-MZ', {
            style: 'currency',
            currency: 'MZN',
          }).format(commissionAmount);

          await notificationService.schedulePushNotification(
            'Nova comissão!',
            `Ganhaste ${formattedAmount} por uma indicação`,
            { type: 'affiliate' }
          );
        } catch (notificationError) {
          console.error('Error sending affiliate notification:', notificationError);
        }
      }
    }

    return { error: null };
  } catch (error: any) {
    console.error('Update referral status error:', error);
    return { error };
  }
};

/**
 * Get affiliate level based on earnings and conversions
 */
export const getAffiliateLevel = (totalEarnings: number, completedReferrals: number) => {
  return determineAffiliateLevel(completedReferrals);
};

/**
 * Get level color
 */
export const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#A8A9AD',
    gold: '#D4AF37',
    platinum: '#E5E4E2',
  };
  return colors[level] || '#CD7F32';
};

/**
 * Get level name in Portuguese
 */
export const getLevelName = (level: string): string => {
  const names: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    platinum: 'Platina',
  };
  return names[level] || level;
};
