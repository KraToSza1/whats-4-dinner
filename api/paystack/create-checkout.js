/**
 * Paystack Checkout Session Creator
 * Good for South Africa - African payment gateway
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        res.status(500).json({ 
            error: "Missing Paystack credentials. Set PAYSTACK_SECRET_KEY in Vercel environment variables." 
        });
        return;
    }

    try {
        const { plan, billingPeriod, userEmail } = req.body;

        // Validate plan
        const validPlans = ["supporter", "unlimited", "family"];
        if (!validPlans.includes(plan)) {
            res.status(400).json({ error: "Invalid plan" });
            return;
        }

        // Get plan code from environment variables
        const planKey = `PAYSTACK_PLAN_${plan.toUpperCase()}_${billingPeriod.toUpperCase()}`;
        const planCode = process.env[planKey];

        if (!planCode) {
            res.status(500).json({ 
                error: `Missing Paystack plan code for ${plan} (${billingPeriod}). Set ${planKey} in Vercel environment variables.` 
            });
            return;
        }

        // Create Paystack subscription
        const paystackUrl = "https://api.paystack.co";
        const response = await fetch(`${paystackUrl}/subscription`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${secretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                customer: userEmail || undefined,
                plan: planCode,
                metadata: {
                    plan: plan,
                    billing_period: billingPeriod,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Paystack checkout failed");
        }

        const data = await response.json();
        
        // Paystack returns authorization URL
        const authorizationUrl = data.data?.authorization_url || data.authorization_url;
        
        if (!authorizationUrl) {
            throw new Error("No checkout URL returned from Paystack");
        }

        res.json({ 
            url: authorizationUrl, 
            reference: data.data?.reference || data.reference 
        });
    } catch (error) {
        console.error("Paystack checkout error:", error);
        res.status(500).json({ 
            error: error.message || "Failed to create Paystack checkout session" 
        });
    }
}

