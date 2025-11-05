/**
 * Paddle Checkout Session Creator
 * RECOMMENDED for South Africa - Works everywhere, handles taxes
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const vendorId = process.env.PADDLE_VENDOR_ID;
    const apiKey = process.env.PADDLE_API_KEY;

    if (!vendorId || !apiKey) {
        res.status(500).json({ 
            error: "Missing Paddle credentials. Set PADDLE_VENDOR_ID and PADDLE_API_KEY in Vercel environment variables." 
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

        // Get price ID from environment variables
        const priceKey = `PADDLE_PRICE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()}`;
        const priceId = process.env[priceKey];

        if (!priceId) {
            res.status(500).json({ 
                error: `Missing Paddle price ID for ${plan} (${billingPeriod}). Set ${priceKey} in Vercel environment variables.` 
            });
            return;
        }

        // Create Paddle checkout
        // Use sandbox for testing, production for live
        const paddleUrl = process.env.PADDLE_ENV === "production" 
            ? "https://api.paddle.com" 
            : "https://sandbox-api.paddle.com";
        const response = await fetch(`${paddleUrl}/transactions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                items: [
                    {
                        price_id: priceId,
                        quantity: 1,
                    },
                ],
                customer_email: userEmail || undefined,
                custom_data: {
                    plan: plan,
                    billing_period: billingPeriod,
                },
                success_url: `${req.headers.origin}/?success=true&plan=${plan}`,
                return_url: `${req.headers.origin}/?canceled=true`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Paddle checkout failed");
        }

        const data = await response.json();
        
        // Paddle returns a checkout URL
        const checkoutUrl = data.data?.checkout?.url || data.checkout_url;
        
        if (!checkoutUrl) {
            throw new Error("No checkout URL returned from Paddle");
        }

        res.json({ 
            url: checkoutUrl, 
            checkoutId: data.data?.id || data.id 
        });
    } catch (error) {
        console.error("Paddle checkout error:", error);
        res.status(500).json({ 
            error: error.message || "Failed to create Paddle checkout session" 
        });
    }
}

