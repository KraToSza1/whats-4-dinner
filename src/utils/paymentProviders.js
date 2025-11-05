/**
 * Payment Provider Abstraction
 * Supports multiple payment providers (Stripe, Paddle, Paystack, etc.)
 * 
 * PADDLE (Recommended): Works globally, handles taxes/VAT, merchant of record
 * STRIPE: Works in most countries, you handle taxes
 * PAYSTACK: Good for African markets
 */

// Use import.meta.env for Vite (browser environment)
const PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || "paddle"; // "stripe", "paddle", "paystack"

/**
 * Create checkout session with any provider
 */
export async function createCheckoutSession(plan, billingPeriod, userEmail = null) {
    switch (PROVIDER) {
        case "stripe":
            return createStripeCheckout(plan, billingPeriod, userEmail);
        case "paddle":
            return createPaddleCheckout(plan, billingPeriod, userEmail);
        case "paystack":
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
        const response = await fetch("/api/stripe/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, billingPeriod, userEmail }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Stripe checkout failed");
        }

        const data = await response.json();
        return { url: data.url, sessionId: data.sessionId };
    } catch (error) {
        console.error("Stripe error:", error);
        throw error;
    }
}

/**
 * Paddle checkout (RECOMMENDED for South Africa)
 */
async function createPaddleCheckout(plan, billingPeriod, userEmail) {
    try {
        const response = await fetch("/api/paddle/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, billingPeriod, userEmail }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Paddle checkout failed");
        }

        const data = await response.json();
        return { url: data.url, checkoutId: data.checkoutId };
    } catch (error) {
        console.error("Paddle error:", error);
        throw error;
    }
}

/**
 * Paystack checkout (Good for South Africa)
 */
async function createPaystackCheckout(plan, billingPeriod, userEmail) {
    try {
        const response = await fetch("/api/paystack/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, billingPeriod, userEmail }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Paystack checkout failed");
        }

        const data = await response.json();
        return { url: data.url, reference: data.reference };
    } catch (error) {
        console.error("Paystack error:", error);
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
            throw new Error("No checkout URL returned");
        }
    } catch (error) {
        console.error("Checkout redirect error:", error);
        alert(`Payment error: ${error.message}\n\nPlease try again or contact support.`);
        throw error;
    }
}

/**
 * Check payment success (from URL params)
 */
export function checkPaymentSuccess() {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const plan = params.get("plan");
    const canceled = params.get("canceled");

    if (success === "true" && plan) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, plan };
    }

    if (canceled === "true") {
        window.history.replaceState({}, document.title, window.location.pathname);
        return { canceled: true };
    }

    return null;
}

