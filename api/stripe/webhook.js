import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.supabase_user_id;
    if (userId && userId !== "anon") {
      await supabase.from("profiles").upsert({ id: userId, plan: "pro" }, { onConflict: "id" });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    // TODO: look up user by customer id if you store mapping
  }

  res.json({ received: true });
}


