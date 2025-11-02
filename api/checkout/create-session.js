import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID; // recurring price
  if (!stripeKey || !priceId) { res.status(500).json({ error: "Missing Stripe env vars" }); return; }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  // Optional: read current user via Supabase cookie (anon fallback)
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const customerEmail = user?.email || undefined;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${req.headers.origin}/?success=1`,
      cancel_url: `${req.headers.origin}/?canceled=1`,
      metadata: { supabase_user_id: user?.id || "anon" },
    });
    res.redirect(303, session.url);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}


