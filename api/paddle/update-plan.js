import { createClient } from '@supabase/supabase-js';

/**
 * Direct plan update endpoint
 * Called immediately after payment to update plan without waiting for webhook
 */
/* eslint-disable no-undef */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { transactionId, plan, billingPeriod, userEmail } = req.body;

    if (!transactionId || !plan || !userEmail) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Get user by email
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ [UPDATE PLAN] Error listing users:', usersError);
      res.status(500).json({ error: 'Failed to find user' });
      return;
    }

    const user = users?.users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      console.error('❌ [UPDATE PLAN] User not found:', userEmail);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update profile with new plan
    const { error: updateError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: userEmail,
        plan: plan,
        billing_period: billingPeriod || 'monthly',
        paddle_transaction_id: transactionId,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (updateError) {
      console.error('❌ [UPDATE PLAN] Error updating profile:', updateError);
      res.status(500).json({ error: 'Failed to update plan' });
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`✅ [UPDATE PLAN] Plan updated: ${plan} for ${userEmail}`);

    res.json({ success: true, plan, userEmail });
  } catch (error) {
    console.error('❌ [UPDATE PLAN] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update plan' });
  }
}
