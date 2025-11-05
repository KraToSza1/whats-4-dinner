import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Body parser disabled for Stripe webhook signature verification

function buffer(req) { return new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
}); }

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).end("Method not allowed"); return; }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const plan = session.metadata?.plan || "supporter";
    const billingPeriod = session.metadata?.billing_period || "monthly";
    const customerEmail = session.customer_email;

    // Store subscription in Supabase if user is authenticated
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
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
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
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const plan = subscription.metadata?.plan || "supporter";
    const status = subscription.status;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Update subscription status in Supabase
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
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

  // Handle subscription cancellation/deletion
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Update subscription status to canceled
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
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
}


