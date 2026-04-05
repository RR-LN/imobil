import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Commission calculation functions
function calculateCommission(propertyValue: number, commissionType: 'agent' | 'user'): number {
  const percentage = commissionType === 'agent' ? 0.02 : 0.005;
  const calculatedAmount = propertyValue * percentage;
  const minimumAmount = commissionType === 'agent' ? 0 : 500;
  return commissionType === 'agent' ? calculatedAmount : Math.max(calculatedAmount, minimumAmount);
}

function calculateRegistrationBonus(): number {
  return 200;
}

function getCommissionTypeByRole(userRole: string): 'agent' | 'user' {
  return userRole === 'agent' ? 'agent' : 'user';
}

function determineAffiliateLevel(conversions: number): string {
  if (conversions >= 31) return 'platinum';
  if (conversions >= 16) return 'gold';
  if (conversions >= 6) return 'silver';
  return 'bronze';
}

Deno.serve(async (req) => {
  try {
    const { record, old_record } = await req.json();
    
    // Check if this is a booking status change to 'confirmed'
    if (record.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ message: 'Booking not confirmed, skipping' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Only process when status changes to confirmed (not already confirmed)
    if (old_record?.status === 'confirmed') {
      return new Response(
        JSON.stringify({ message: 'Already confirmed, skipping' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bookingId = record.id;
    const buyerId = record.buyer_id;
    const propertyId = record.property_id;

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('price')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const propertyValue = property.price;

    // Check if buyer came from a referral
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', buyerId)
      .single();

    if (!profile?.referred_by) {
      return new Response(
        JSON.stringify({ message: 'No referral for this buyer' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const affiliateId = profile.referred_by;

    // Get affiliate record
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) {
      return new Response(
        JSON.stringify({ message: 'Affiliate not found' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get referrer's role to determine commission type
    const { data: referrer } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', affiliateId)
      .single();

    const commissionType = getCommissionTypeByRole(referrer?.role || 'buyer');
    
    // Calculate commission
    const baseCommission = calculateCommission(propertyValue, commissionType);
    const registrationBonus = calculateRegistrationBonus();
    const totalCommission = baseCommission + registrationBonus;

    // Check if referral record exists for this affiliate and referred user
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliateId)
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
          affiliate_id: affiliateId,
          referred_user_id: buyerId,
          property_id: propertyId,
          status: 'completed',
          commission_amount: totalCommission,
        });

      if (createError) throw createError;
    }

    // Update affiliate total earnings
    const { error: earningsError } = await supabase.rpc('update_affiliate_earnings', {
      affiliate_id: affiliateId,
      amount: totalCommission,
    });

    if (earningsError) {
      console.error('Error updating earnings:', earningsError);
    }

    // Get current conversions count and update level
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliateId)
      .eq('status', 'completed');

    const conversions = referrals?.length || 0;
    const newLevel = determineAffiliateLevel(conversions);

    await supabase
      .from('affiliates')
      .update({ level: newLevel })
      .eq('id', affiliateId);

    // Send push notification if affiliate has a push token
    const { data: affiliateProfile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', affiliateId)
      .single();

    if (affiliateProfile?.push_token) {
      // You would use Expo Push API here to send notification
      // For now, we'll log it
      console.log(`Would send push notification to ${affiliateProfile.push_token}`);
      
      // Example Expo push notification:
      // await fetch('https://exp.host/--/api/v2/push/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: affiliateProfile.push_token,
      //     title: 'Nova comissão!',
      //     body: `Ganhaste ${totalCommission.toLocaleString('pt-PT')} MT por uma indicação convertida!`,
      //     data: { type: 'affiliate' },
      //   }),
      // });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        commission: totalCommission,
        level: newLevel,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing referral commission:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
