/**
 * Paddle Checkout Session Creator
 * RECOMMENDED for South Africa - Works everywhere, handles taxes
 *
 * Note: This is a Vercel serverless function, so process.env is available at runtime
 */
/* eslint-disable no-undef */
export default async function handler(req, res) {
  try {
    // Add CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse body if it's a string (sometimes vercel dev doesn't auto-parse)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        res.status(400).json({ error: 'Invalid JSON in request body' });
        return;
      }
    }

    const vendorId = process.env.PADDLE_VENDOR_ID;
    const apiKey = process.env.PADDLE_API_KEY;

    if (!vendorId || !apiKey) {
      console.error('❌ [PADDLE API] Missing credentials:', {
        missingVendorId: !vendorId,
        missingApiKey: !apiKey,
        availableEnvVars: Object.keys(process.env).filter(k => k.startsWith('PADDLE')),
      });
      res.status(500).json({
        error:
          'Missing Paddle credentials. Set PADDLE_VENDOR_ID and PADDLE_API_KEY in Vercel environment variables.',
      });
      return;
    }

    const { plan, billingPeriod, userEmail } = body;

    // Validate plan
    const validPlans = ['supporter', 'unlimited', 'family'];
    if (!validPlans.includes(plan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    // Get price ID from environment variables
    const priceKey = `PADDLE_PRICE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()}`;
    const priceId = process.env[priceKey];

    if (!priceId) {
      console.error('❌ [PADDLE API] Missing price ID:', priceKey);
      res.status(500).json({
        error: `Missing Paddle price ID for ${plan} (${billingPeriod}). Set ${priceKey} in Vercel environment variables.`,
      });
      return;
    }

    // Create Paddle checkout
    // Use sandbox for testing, production for live
    const paddleEnv = process.env.PADDLE_ENV || 'sandbox';
    const paddleUrl =
      paddleEnv === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';

    const requestBody = {
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
      success_url: `${req.headers.origin || 'http://localhost:3000'}/?success=true&plan=${plan}`,
      return_url: `${req.headers.origin || 'http://localhost:3000'}/?canceled=true`,
    };

    const response = await fetch(`${paddleUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Get response text first to handle errors properly
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Paddle checkout failed';
      try {
        if (responseText) {
          const error = JSON.parse(responseText);
          errorMessage = error.error?.message || error.message || error.error || errorMessage;
        } else {
          errorMessage = `Paddle API error: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        errorMessage = `Paddle API error: ${response.status} ${response.statusText}`;
        if (responseText) {
          errorMessage += ` - ${responseText.substring(0, 200)}`;
        }
      }
      console.error('❌ [PADDLE API] Paddle API error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Parse successful response
    if (!responseText) {
      throw new Error('Empty response from Paddle API');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from Paddle: ${responseText.substring(0, 200)}`);
    }

    // Paddle API v2 returns data in different formats
    // Check multiple possible response structures
    const checkoutUrl =
      data.data?.checkout?.url ||
      data.data?.checkout_url ||
      data.checkout?.url ||
      data.checkout_url ||
      data.url;

    if (!checkoutUrl) {
      console.error(
        '❌ [PADDLE API] No checkout URL found. Response:',
        JSON.stringify(data, null, 2)
      );
      throw new Error('No checkout URL returned from Paddle. Check API response structure.');
    }

    res.json({
      url: checkoutUrl,
      checkoutId: data.data?.id || data.data?.transaction_id || data.id || data.transaction_id,
    });
  } catch (error) {
    console.error('❌ [PADDLE API] Error:', error.message);

    // Make sure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'Failed to create Paddle checkout session',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}
/* eslint-enable no-undef */
