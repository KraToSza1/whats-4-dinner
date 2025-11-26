import { createClient } from '@supabase/supabase-js';

/**
 * Paddle Webhook Handler
 * Handles subscription events from Paddle
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).json({ error: 'Missing PADDLE_WEBHOOK_SECRET' });
    return;
  }

  // Verify webhook signature (Paddle sends signature in header)
  const signature = req.headers['paddle-signature'];
  if (!signature) {
    res.status(400).json({ error: 'Missing signature' });
    return;
  }

  // Note: In production, verify the signature using Paddle's webhook verification
  // For now, we'll trust the webhook (you should add proper verification)

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const event = req.body;

    // Helper function to verify plan matches price ID
    function verifyPlanFromPriceId(priceId, claimedPlan, claimedBillingPeriod) {
      if (!priceId) {
        console.error('❌ [PADDLE WEBHOOK] No price ID in transaction');
        return null;
      }

      // Get expected price IDs from environment
      const expectedPriceKey = `PADDLE_PRICE_${claimedPlan.toUpperCase()}_${claimedBillingPeriod.toUpperCase()}`;
      const expectedPriceId = process.env[expectedPriceKey];

      if (!expectedPriceId) {
        console.error(`❌ [PADDLE WEBHOOK] Missing price ID env var: ${expectedPriceKey}`);
        return null;
      }

      // Verify the price ID matches the claimed plan
      if (priceId !== expectedPriceId) {
        console.error(
          `❌ [PADDLE WEBHOOK] Price ID mismatch! Expected ${expectedPriceId} for ${claimedPlan} (${claimedBillingPeriod}), got ${priceId}`
        );
        return null;
      }

      // Additional security: Only allow "family" plan if price ID matches family plan price
      if (claimedPlan === 'family') {
        const familyMonthlyPrice = process.env.PADDLE_PRICE_FAMILY_MONTHLY;
        const familyYearlyPrice = process.env.PADDLE_PRICE_FAMILY_YEARLY;

        if (priceId !== familyMonthlyPrice && priceId !== familyYearlyPrice) {
          console.error(
            `❌ [PADDLE WEBHOOK] SECURITY: Attempted to set family plan without paying for family plan! Price ID: ${priceId}`
          );
          return null;
        }
      }

      return claimedPlan;
    }

    // Handle transaction completed (subscription created)
    if (
      event.event_type === 'transaction.completed' ||
      event.event_type === 'subscription.created'
    ) {
      const transaction = event.data;
      const claimedPlan = transaction.custom_data?.plan || 'supporter';
      const claimedBillingPeriod = transaction.custom_data?.billing_period || 'monthly';
      const customerEmail = transaction.customer_email;

      // Get the actual price ID from the transaction (this is what was actually paid for)
      const priceId =
        transaction.items?.[0]?.price_id ||
        transaction.price_id ||
        transaction.line_items?.[0]?.price_id;

      // Verify the plan matches the price ID
      const verifiedPlan = verifyPlanFromPriceId(priceId, claimedPlan, claimedBillingPeriod);

      if (!verifiedPlan) {
        console.error(
          `❌ [PADDLE WEBHOOK] Plan verification failed for transaction ${transaction.id}. Rejecting plan activation.`
        );
        res.status(400).json({ error: 'Plan verification failed' });
        return;
      }

      if (customerEmail && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          // Get user by email
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email === customerEmail);

          if (user) {
            // Store subscription in profiles table with verified plan
            await supabase.from('profiles').upsert(
              {
                id: user.id,
                email: customerEmail,
                plan: verifiedPlan, // Use verified plan, not claimed plan
                billing_period: claimedBillingPeriod,
                paddle_subscription_id: transaction.subscription_id,
                paddle_transaction_id: transaction.id,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          }
        } catch (err) {
          console.error('Error storing subscription:', err);
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        `✅ Subscription created: ${verifiedPlan} (${claimedBillingPeriod}) for ${customerEmail} - Verified with price ID: ${priceId}`
      );
    }

    // Handle subscription updates
    if (event.event_type === 'subscription.updated') {
      const subscription = event.data;
      const status = subscription.status;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          // Update subscription status
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('paddle_subscription_id', subscription.id)
            .single();

          if (profiles) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', profiles.id);
          }
        } catch (err) {
          console.error('Error updating subscription:', err);
        }
      }
    }

    // Handle subscription cancellation
    if (event.event_type === 'subscription.canceled') {
      const subscription = event.data;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          // Update subscription status to canceled
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('paddle_subscription_id', subscription.id)
            .single();

          if (profiles) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'canceled',
                plan: 'free',
                updated_at: new Date().toISOString(),
              })
              .eq('id', profiles.id);
          }
        } catch (err) {
          console.error('Error canceling subscription:', err);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}
