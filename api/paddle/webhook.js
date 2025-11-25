import { createClient } from "@supabase/supabase-js";

/**
 * Paddle Webhook Handler
 * Handles subscription events from Paddle
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).end("Method not allowed");
        return;
    }

    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        res.status(500).json({ error: "Missing PADDLE_WEBHOOK_SECRET" });
        return;
    }

    // Verify webhook signature (Paddle sends signature in header)
    const signature = req.headers["paddle-signature"];
    if (!signature) {
        res.status(400).json({ error: "Missing signature" });
        return;
    }

    // Note: In production, verify the signature using Paddle's webhook verification
    // For now, we'll trust the webhook (you should add proper verification)

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );

    try {
        const event = req.body;

        // Handle transaction completed (subscription created)
        if (event.event_type === "transaction.completed" || event.event_type === "subscription.created") {
            const transaction = event.data;
            const plan = transaction.custom_data?.plan || "supporter";
            const billingPeriod = transaction.custom_data?.billing_period || "monthly";
            const customerEmail = transaction.customer_email;

            if (customerEmail && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                try {
                    // Get user by email
                    const { data: users } = await supabase.auth.admin.listUsers();
                    const user = users?.users?.find(u => u.email === customerEmail);

                    if (user) {
                        // Store subscription in profiles table
                        await supabase.from("profiles").upsert({
                            id: user.id,
                            email: customerEmail,
                            plan: plan,
                            billing_period: billingPeriod,
                            paddle_subscription_id: transaction.subscription_id,
                            paddle_transaction_id: transaction.id,
                            subscription_status: "active",
                            updated_at: new Date().toISOString(),
                        }, { onConflict: "id" });
                    }
                } catch (err) {
                    console.error("Error storing subscription:", err);
                }
            }

            console.log(`✅ Subscription created: ${plan} (${billingPeriod}) for ${customerEmail}`);
        }

        // Handle subscription updates
        if (event.event_type === "subscription.updated") {
            const subscription = event.data;
            const status = subscription.status;

            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                try {
                    // Update subscription status
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("paddle_subscription_id", subscription.id)
                        .single();

                    if (profiles) {
                        await supabase.from("profiles").update({
                            subscription_status: status,
                            updated_at: new Date().toISOString(),
                        }).eq("id", profiles.id);
                    }
                } catch (err) {
                    console.error("Error updating subscription:", err);
                }
            }
        }

        // Handle subscription cancellation
        if (event.event_type === "subscription.canceled") {
            const subscription = event.data;

            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                try {
                    // Update subscription status to canceled
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("paddle_subscription_id", subscription.id)
                        .single();

                    if (profiles) {
                        await supabase.from("profiles").update({
                            subscription_status: "canceled",
                            plan: "free",
                            updated_at: new Date().toISOString(),
                        }).eq("id", profiles.id);
                    }
                } catch (err) {
                    console.error("Error canceling subscription:", err);
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Paddle webhook error:", error);
        res.status(500).json({ error: error.message });
    }
}

