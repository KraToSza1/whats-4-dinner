import { createClient } from '@supabase/supabase-js';

/**
 * Direct plan update endpoint
 * Called immediately after payment to update plan without waiting for webhook
 */
/* eslint-disable no-undef */
export default async function handler(req, res) {
  console.warn('🚀 [UPDATE PLAN API] ============================================');
  console.warn('🚀 [UPDATE PLAN API] REQUEST RECEIVED');
  console.warn('🚀 [UPDATE PLAN API] Method:', req.method);
  console.warn('🚀 [UPDATE PLAN API] ============================================');

  if (req.method !== 'POST') {
    console.error('❌ [UPDATE PLAN API] Wrong method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { transactionId, plan, billingPeriod, userEmail } = req.body;
    console.warn('📋 [UPDATE PLAN API] Step 1: Parsed request body:', {
      hasTransactionId: !!transactionId,
      transactionId: transactionId,
      plan: plan,
      billingPeriod: billingPeriod,
      hasUserEmail: !!userEmail,
      userEmail: userEmail,
    });

    if (!transactionId || !plan || !userEmail) {
      console.error('❌ [UPDATE PLAN API] Step 1 FAILED: Missing required fields:', {
        hasTransactionId: !!transactionId,
        hasPlan: !!plan,
        hasUserEmail: !!userEmail,
      });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    console.warn('✅ [UPDATE PLAN API] Step 1 SUCCESS: All required fields present');

    console.warn('📋 [UPDATE PLAN API] Step 2: Creating Supabase client...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    console.warn('✅ [UPDATE PLAN API] Step 2 SUCCESS: Supabase client created');
    console.warn('📋 [UPDATE PLAN API] Supabase config:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    });

    // Get user by email
    console.warn('📋 [UPDATE PLAN API] Step 3: Listing all users from Supabase...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ [UPDATE PLAN API] Step 3 FAILED: Error listing users:', usersError);
      res.status(500).json({ error: 'Failed to find user' });
      return;
    }
    console.warn('✅ [UPDATE PLAN API] Step 3 SUCCESS: Users listed:', {
      userCount: users?.users?.length || 0,
      userEmails: users?.users?.map(u => u.email).slice(0, 5) || [],
    });

    console.warn('📋 [UPDATE PLAN API] Step 4: Finding user by email:', userEmail);
    const user = users?.users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
    console.warn('📋 [UPDATE PLAN API] User search result:', {
      found: !!user,
      userId: user?.id,
      userEmail: user?.email,
      searchedEmail: userEmail,
    });

    if (!user) {
      console.error('❌ [UPDATE PLAN API] Step 4 FAILED: User not found');
      console.error('❌ [UPDATE PLAN API] Searched email:', userEmail);
      console.error(
        '❌ [UPDATE PLAN API] Available emails:',
        users?.users?.map(u => u.email) || []
      );
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.warn('✅ [UPDATE PLAN API] Step 4 SUCCESS: User found:', {
      userId: user.id,
      userEmail: user.email,
    });

    // Update profile with new plan
    console.warn('📋 [UPDATE PLAN API] Step 5: Updating profile in Supabase...');
    const updateData = {
      id: user.id,
      email: userEmail,
      plan: plan,
      billing_period: billingPeriod || 'monthly',
      paddle_transaction_id: transactionId,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    };
    console.warn('📋 [UPDATE PLAN API] Update data:', updateData);

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .upsert(updateData, { onConflict: 'id' });

    if (updateError) {
      console.error('❌ [UPDATE PLAN API] Step 5 FAILED: Error updating profile');
      console.error('❌ [UPDATE PLAN API] Error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
      res.status(500).json({ error: 'Failed to update plan', details: updateError.message });
      return;
    }
    console.warn('✅ [UPDATE PLAN API] Step 5 SUCCESS: Profile updated');
    console.warn('✅ [UPDATE PLAN API] Update result:', updateResult);

    // Verify the update worked
    console.warn('📋 [UPDATE PLAN API] Step 6: Verifying update...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('plan, subscription_status, billing_period')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ [UPDATE PLAN API] Step 6 FAILED: Error verifying update:', verifyError);
    } else {
      console.warn('✅ [UPDATE PLAN API] Step 6 SUCCESS: Verified profile:', verifyProfile);
    }

    // eslint-disable-next-line no-console
    console.log(`✅ [UPDATE PLAN API] ============================================`);
    // eslint-disable-next-line no-console
    console.log(`✅ [UPDATE PLAN API] PLAN UPDATE COMPLETE: ${plan} for ${userEmail}`);
    // eslint-disable-next-line no-console
    console.log(`✅ [UPDATE PLAN API] ============================================`);

    res.json({ success: true, plan, userEmail, verified: verifyProfile });
  } catch (error) {
    console.error('❌ [UPDATE PLAN API] ============================================');
    console.error('❌ [UPDATE PLAN API] EXCEPTION CAUGHT:', error);
    console.error('❌ [UPDATE PLAN API] Error message:', error.message);
    console.error('❌ [UPDATE PLAN API] Error stack:', error.stack);
    console.error('❌ [UPDATE PLAN API] ============================================');
    res.status(500).json({ error: error.message || 'Failed to update plan' });
  }
}
