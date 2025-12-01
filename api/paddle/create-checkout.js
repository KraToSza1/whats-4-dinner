/**
 * Paddle Checkout Session Creator
 * RECOMMENDED for South Africa - Works everywhere, handles taxes
 *
 * Note: This is a Vercel serverless function, so process.env is available at runtime
 */
/* eslint-disable no-undef */
export default async function handler(req, res) {
  try {
    // Add CORS headers - allow all origins (including localhost)
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse body if it's a string (sometimes vercel dev doesn't auto-parse)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_parseError) {
        res.setHeader('Content-Type', 'application/json');
        res.status(400).json({ error: 'Invalid JSON in request body' });
        return;
      }
    }

    const vendorId = process.env.PADDLE_VENDOR_ID;
    const apiKey = process.env.PADDLE_API_KEY;

    // Debug: Log what we have (without exposing sensitive data)
    console.error('🔍 [PADDLE API] Environment check:', {
      hasVendorId: !!vendorId,
      vendorIdLength: vendorId?.length || 0,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      allPaddleVars: Object.keys(process.env).filter(k => k.startsWith('PADDLE')),
    });

    if (!vendorId || !apiKey) {
      console.error('❌ [PADDLE API] Missing credentials:', {
        missingVendorId: !vendorId,
        missingApiKey: !apiKey,
        availableEnvVars: Object.keys(process.env).filter(k => k.startsWith('PADDLE')),
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      });
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        error:
          'Missing Paddle credentials. Set PADDLE_VENDOR_ID and PADDLE_API_KEY in Vercel environment variables.',
        debug: {
          hasVendorId: !!vendorId,
          hasApiKey: !!apiKey,
          availablePaddleVars: Object.keys(process.env).filter(k => k.startsWith('PADDLE')),
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        },
      });
      return;
    }

    const { plan, billingPeriod, userEmail } = body;

    // Validate plan
    const validPlans = ['supporter', 'unlimited', 'family'];
    if (!validPlans.includes(plan)) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    // Get price ID from environment variables
    const priceKey = `PADDLE_PRICE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()}`;
    const priceId = process.env[priceKey];

    if (!priceId) {
      console.error('❌ [PADDLE API] Missing price ID:', priceKey);
      res.setHeader('Content-Type', 'application/json');
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

    console.error('🔍 [PADDLE API] Making request to Paddle:', {
      url: `${paddleUrl}/transactions`,
      method: 'POST',
      vendorId,
      apiKeyLength: apiKey?.length || 0,
      requestBody: JSON.stringify(requestBody, null, 2),
    });

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

    console.error('🔍 [PADDLE API] Paddle API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseText: responseText ? responseText.substring(0, 500) : 'empty',
    });

    if (!response.ok) {
      let errorMessage = 'Paddle checkout failed';
      let errorDetails = null;

      try {
        if (responseText) {
          const error = JSON.parse(responseText);
          console.error('🔍 [PADDLE API] Parsed error object:', error);

          // Paddle API v1 returns errors in different formats
          // Check for the actual error structure
          if (error.type === 'request_error' || error.code) {
            // This is a Paddle API error - use the detail/message
            errorMessage = error.detail || error.message || errorMessage;
            errorDetails = {
              type: error.type,
              code: error.code,
              detail: error.detail,
              documentation_url: error.documentation_url,
            };
          } else if (error.error) {
            // Nested error object - could be string or object
            if (typeof error.error === 'string') {
              // If error.error is a JSON string (double-encoded), parse it
              try {
                const nestedError = JSON.parse(error.error);
                errorMessage = nestedError.detail || nestedError.message || errorMessage;
                errorDetails = nestedError;
              } catch {
                // Not JSON, just use the string
                errorMessage = error.error;
              }
            } else if (typeof error.error === 'object') {
              errorMessage = error.error.detail || error.error.message || errorMessage;
              errorDetails = error.error;
            } else {
              errorMessage = error.error;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else {
          errorMessage = `Paddle API error: ${response.status} ${response.statusText}`;
        }
      } catch (_parseError) {
        errorMessage = `Paddle API error: ${response.status} ${response.statusText}`;
        if (responseText) {
          errorMessage += ` - ${responseText.substring(0, 200)}`;
        }
      }

      console.error('❌ [PADDLE API] Paddle API error:', errorMessage);
      console.error('❌ [PADDLE API] Error details:', errorDetails);

      // Throw error with details
      const finalError = new Error(errorMessage);
      if (errorDetails) {
        finalError.details = errorDetails;
      }
      throw finalError;
    }

    // Parse successful response
    if (!responseText) {
      throw new Error('Empty response from Paddle API');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (_parseError) {
      throw new Error(`Invalid JSON response from Paddle: ${responseText.substring(0, 200)}`);
    }

    // Log the full response for debugging
    console.error('🔍 [PADDLE API] Full response data:', JSON.stringify(data, null, 2));

    // Paddle API v2 returns checkout URL in data.data.checkout.url
    // This URL points to your Default Payment Link with _ptxn parameter
    // Your page needs to detect _ptxn and use Paddle.js to open checkout
    let checkoutUrl =
      data.data?.checkout?.url || // This is where Paddle puts it
      data.data?.checkout_url ||
      data.data?.checkouts?.[0]?.url ||
      data.checkout?.url ||
      data.checkout_url ||
      data.url;

    console.error('🔍 [PADDLE API] Extracted checkout URL:', checkoutUrl);

    // If no checkout URL, try to get it from transaction preview
    if (!checkoutUrl && data.data?.id) {
      const transactionId = data.data.id;
      console.error(
        '🔍 [PADDLE API] No checkout URL in response, trying preview endpoint for transaction:',
        transactionId
      );

      try {
        const previewResponse = await fetch(`${paddleUrl}/transactions/${transactionId}/preview`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (previewResponse.ok) {
          const previewText = await previewResponse.text();
          const previewData = JSON.parse(previewText);
          console.error('🔍 [PADDLE API] Preview response:', JSON.stringify(previewData, null, 2));
          checkoutUrl = previewData.data?.checkout?.url || previewData.data?.checkout_url;
        }
      } catch (previewError) {
        console.error('🔍 [PADDLE API] Preview endpoint failed:', previewError.message);
      }

      // If still no URL, we need to use Paddle's hosted checkout
      // Paddle API v2 uses a different approach - we need to redirect to the default payment link
      // with the transaction ID, OR use the checkout preview endpoint
      if (!checkoutUrl) {
        // Try the checkout preview endpoint (different from transaction preview)
        try {
          const checkoutPreviewResponse = await fetch(`${paddleUrl}/checkouts`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction_id: transactionId,
            }),
          });

          if (checkoutPreviewResponse.ok) {
            const checkoutPreviewText = await checkoutPreviewResponse.text();
            const checkoutPreviewData = JSON.parse(checkoutPreviewText);
            console.error(
              '🔍 [PADDLE API] Checkout preview response:',
              JSON.stringify(checkoutPreviewData, null, 2)
            );
            checkoutUrl = checkoutPreviewData.data?.url || checkoutPreviewData.data?.checkout_url;
          }
        } catch (checkoutPreviewError) {
          console.error(
            '🔍 [PADDLE API] Checkout preview endpoint failed:',
            checkoutPreviewError.message
          );
        }

        // Last resort: construct checkout URL using Paddle's standard format
        if (!checkoutUrl) {
          const isSandbox = paddleUrl.includes('sandbox');
          const checkoutDomain = isSandbox
            ? 'https://sandbox-checkout.paddle.com'
            : 'https://checkout.paddle.com';
          // Paddle API v2 checkout URL format
          checkoutUrl = `${checkoutDomain}/transaction/${transactionId}`;
          console.error('🔍 [PADDLE API] Constructed checkout URL (fallback):', checkoutUrl);
        }
      }
    }

    if (!checkoutUrl) {
      console.error(
        '❌ [PADDLE API] No checkout URL found. Response:',
        JSON.stringify(data, null, 2)
      );
      throw new Error('No checkout URL returned from Paddle. Check API response structure.');
    }

    // Extract transaction ID from checkout URL or response
    const transactionId =
      data.data?.id || data.data?.transaction_id || data.id || data.transaction_id;

    // Extract _ptxn from URL if present (Paddle adds this to Default Payment Link)
    let ptxnParam = null;
    try {
      const urlObj = new URL(checkoutUrl);
      ptxnParam = urlObj.searchParams.get('_ptxn') || transactionId;
    } catch {
      // If URL parsing fails, use transaction ID
      ptxnParam = transactionId;
    }

    // Always set content-type header explicitly
    res.setHeader('Content-Type', 'application/json');
    res.json({
      url: checkoutUrl,
      checkoutId: transactionId,
      transactionId: transactionId,
      _ptxn: ptxnParam, // Include transaction ID for localhost handling
    });
  } catch (error) {
    console.error('❌ [PADDLE API] =========================================');
    console.error('❌ [PADDLE API] Error caught:', error);
    console.error('❌ [PADDLE API] Error message:', error?.message);
    console.error('❌ [PADDLE API] Error details:', error?.details);
    console.error('❌ [PADDLE API] Error stack:', error?.stack);
    console.error('❌ [PADDLE API] =========================================');

    // Make sure we always send a JSON response, even on error
    if (!res.headersSent) {
      // Set content-type header explicitly
      res.setHeader('Content-Type', 'application/json');

      // Ensure error message is always a string
      let errorMessage =
        error?.message || error?.toString() || 'Failed to create Paddle checkout session';

      // If error has details (from Paddle API), include them
      const response = {
        error: errorMessage,
      };

      // Include error details if available (for Paddle API errors)
      if (error?.details) {
        response.code = error.details.code;
        response.detail = error.details.detail;
        response.documentation_url = error.details.documentation_url;
      }

      // Include stack trace in development
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
        response.stack = error.stack;
      }

      res.status(500).json(response);
    } else {
      // If headers were already sent, log the error but can't send response
      console.error('❌ [PADDLE API] Headers already sent, cannot send error response');
    }
  }
}
/* eslint-enable no-undef */
