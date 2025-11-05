import Stripe from "stripe";

/**
 * Create Stripe Checkout Session
 * Handles subscription creation for all plans
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        res.status(500).json({ error: "Missing STRIPE_SECRET_KEY env var" });
        return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    try {
        const { plan, billingPeriod, userEmail } = req.body;

        // Validate plan
        const validPlans = ["supporter", "unlimited", "family"];
        if (!validPlans.includes(plan)) {
            res.status(400).json({ error: "Invalid plan" });
            return;
        }

        // Get price ID from environment variables
        // Format: STRIPE_PRICE_SUPPORTER_MONTHLY, STRIPE_PRICE_UNLIMITED_YEARLY, etc.
        const priceKey = `STRIPE_PRICE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()}`;
        const priceId = process.env[priceKey];

        if (!priceId) {
            res.status(500).json({ 
                error: `Missing price ID for ${plan} (${billingPeriod}). Set ${priceKey} in Vercel environment variables.` 
            });
            return;
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: userEmail || undefined,
            success_url: `${req.headers.origin}/?success=true&plan=${plan}`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
            metadata: {
                plan: plan,
                billing_period: billingPeriod,
            },
            subscription_data: {
                metadata: {
                    plan: plan,
                    billing_period: billingPeriod,
                },
            },
            allow_promotion_codes: true,
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
}

