/**
 * Payment Provider Abstraction
 * Supports multiple payment providers (Stripe, Paddle, Paystack, etc.)
 *
 * PADDLE (Recommended): Works globally, handles taxes/VAT, merchant of record
 * STRIPE: Works in most countries, you handle taxes
 * PAYSTACK: Good for African markets
 */

// Use import.meta.env for Vite (browser environment)
const PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || 'paddle'; // "stripe", "paddle", "paystack"

/**
 * Create checkout session with any provider
 */
export async function createCheckoutSession(plan, billingPeriod, userEmail = null) {
  switch (PROVIDER) {
    case 'stripe':
      return createStripeCheckout(plan, billingPeriod, userEmail);
    case 'paddle':
      return createPaddleCheckout(plan, billingPeriod, userEmail);
    case 'paystack':
      return createPaystackCheckout(plan, billingPeriod, userEmail);
    default:
      throw new Error(`Unsupported payment provider: ${PROVIDER}`);
  }
}

/**
 * Stripe checkout (if available in your region)
 */
async function createStripeCheckout(plan, billingPeriod, userEmail) {
  try {
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billingPeriod, userEmail }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Stripe checkout failed');
    }

    const data = await response.json();
    return { url: data.url, sessionId: data.sessionId };
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}

/**
 * Paddle checkout (RECOMMENDED for South Africa)
 */
async function createPaddleCheckout(plan, billingPeriod, userEmail) {
  try {
    // When using vercel dev, API routes work locally at /api/*
    // When using npm run dev, we need to use deployed URL
    // In production, use relative URL

    const isLocalDev =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isVercelDev = isLocalDev && window.location.port === '3000'; // vercel dev runs on port 3000
    const deployedUrl =
      import.meta.env.VITE_VERCEL_URL ||
      'whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app';

    // Use local API route if vercel dev is running (port 3000)
    // Otherwise use deployed URL for npm run dev (port 5173)
    // In production, use relative URL
    const apiUrl = import.meta.env.PROD
      ? '/api/paddle/create-checkout'
      : isVercelDev
        ? '/api/paddle/create-checkout' // vercel dev - use local route
        : `https://${deployedUrl}/api/paddle/create-checkout`; // npm run dev - use deployed URL

    // Ensure we're using the correct URL
    const finalUrl = apiUrl.startsWith('http') ? apiUrl : `${window.location.origin}${apiUrl}`;

    let response;
    try {
      response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ plan, billingPeriod, userEmail }),
      });
    } catch (fetchError) {
      if (
        fetchError.message.includes('ERR_CONNECTION_REFUSED') ||
        fetchError.message.includes('Failed to fetch') ||
        fetchError.name === 'TypeError'
      ) {
        if (isVercelDev) {
          throw new Error(
            'Cannot connect to payment API. Make sure "npx vercel dev" is running and the API route is accessible.'
          );
        } else {
          throw new Error(
            'Cannot connect to payment server. If using "npm run dev", API calls use the deployed Vercel URL. Make sure your deployment is live.'
          );
        }
      }
      throw fetchError;
    }

    // Get response text first to check if it's empty
    const responseText = await response.text();

    if (!response.ok) {
      // Handle 404 specifically - API route not found (local dev issue)
      if (response.status === 404) {
        const isLocalDev =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalDev) {
          throw new Error(
            'API route not found. To test payments locally, run: npx vercel dev\n\n' +
              'Or test on your deployed Vercel URL where API routes work automatically.'
          );
        }
      }

      // Try to parse error, but handle empty responses
      let errorMessage = 'Paddle checkout failed';
      try {
        if (responseText) {
          const error = JSON.parse(responseText);
          errorMessage = error.error || error.message || errorMessage;
        } else {
          errorMessage = `Paddle checkout failed: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        // If parsing fails, use status text
        errorMessage = `Paddle checkout failed: ${response.status} ${response.statusText}`;
        if (responseText) {
          errorMessage += ` - ${responseText.substring(0, 100)}`;
        }
      }
      throw new Error(errorMessage);
    }

    // Parse successful response
    if (!responseText) {
      throw new Error('Empty response from Paddle checkout');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from Paddle: ${responseText.substring(0, 100)}`);
    }

    if (!data.url) {
      throw new Error('No checkout URL returned from Paddle');
    }

    return { url: data.url, checkoutId: data.checkoutId };
  } catch (error) {
    // Re-throw with a more user-friendly message if it's a parsing error
    if (error.message.includes('JSON.parse') || error.message.includes('unexpected end')) {
      throw new Error(
        'Payment service returned an invalid response. Please check your Paddle configuration and try again.'
      );
    }
    throw error;
  }
}

/**
 * Paystack checkout (Good for South Africa)
 */
async function createPaystackCheckout(plan, billingPeriod, userEmail) {
  try {
    const response = await fetch('/api/paystack/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billingPeriod, userEmail }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Paystack checkout failed');
    }

    const data = await response.json();
    return { url: data.url, reference: data.reference };
  } catch (error) {
    console.error('Paystack error:', error);
    throw error;
  }
}

/**
 * Redirect to checkout (works with any provider)
 */
export async function redirectToCheckout(plan, billingPeriod, userEmail = null) {
  try {
    const { url } = await createCheckoutSession(plan, billingPeriod, userEmail);
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned from payment provider');
    }
  } catch (error) {
    console.error('Checkout redirect error:', error);
    // Use a more user-friendly error message
    const userMessage =
      error.message.includes('JSON.parse') || error.message.includes('unexpected end')
        ? 'Payment service configuration error. Please check your payment settings.'
        : error.message || 'Failed to start checkout process. Please try again.';

    alert(`Payment error: ${userMessage}\n\nPlease try again or contact support.`);
    throw error;
  }
}

/**
 * Check payment success (from URL params)
 */
export function checkPaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('success');
  const plan = params.get('plan');
  const canceled = params.get('canceled');

  if (success === 'true' && plan) {
    window.history.replaceState({}, document.title, window.location.pathname);
    return { success: true, plan };
  }

  if (canceled === 'true') {
    window.history.replaceState({}, document.title, window.location.pathname);
    return { canceled: true };
  }

  return null;
}
