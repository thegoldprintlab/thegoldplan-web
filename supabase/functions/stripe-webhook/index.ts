// Stripe webhook → Supabase auto-provisioning (Fasa B2)
// Deploy: supabase functions deploy stripe-webhook
// Secrets: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//           supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//
// In Stripe Dashboard → Developers → Webhooks, add endpoint:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// Events to send:
//   - checkout.session.completed
//   - customer.subscription.created
//   - customer.subscription.updated
//   - customer.subscription.deleted
//
// Works with both:
//   - Checkout Sessions (Payment Links) — client_reference_id must be the user UUID,
//     which the app passes automatically via ?client_reference_id=<userId>.
//   - Direct Subscriptions — requires customer metadata.user_id set at creation.

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

function cors(): Response {
  return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
    },
  });
}

async function userIdFromSession(session: Stripe.Checkout.Session): Promise<string | null> {
  const ref = session.client_reference_id;
  if (ref && ref.trim() && ref.includes("-")) return ref; // looks like a UUID
  if (session.metadata?.user_id) return session.metadata.user_id;
  if (typeof session.customer === "string") {
    const cust = await stripe.customers.retrieve(session.customer);
    if (!cust.deleted && cust.metadata?.user_id) return cust.metadata.user_id;
  }
  return null;
}

async function upsertSubscription(
  userId: string,
  plan: "monthly" | "lifetime",
  status: string,
  periodEnd: string | null,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
) {
  const payload = {
    user_id: userId,
    plan,
    status,
    current_period_end: periodEnd,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("subscriptions").update(payload).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = await userIdFromSession(session);
  if (!userId) {
    console.error("No user_id resolvable for checkout session", session.id);
    return;
  }

  // Payment Links pass client_reference_id but not a plan — infer from amount/description.
  const amount = session.amount_total ?? 0;
  const plan: "monthly" | "lifetime" =
    session.mode === "subscription" || amount < 100 ? "monthly" : "lifetime";

  let periodEnd: string | null = null;
  if (typeof session.subscription === "string") {
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
  }

  await upsertSubscription(
    userId,
    plan,
    "active",
    periodEnd,
    typeof session.customer === "string" ? session.customer : null,
    typeof session.subscription === "string" ? session.subscription : null,
  );
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const userId =
    sub.metadata?.user_id ??
    (typeof sub.customer === "string"
      ? (await stripe.customers.retrieve(sub.customer).catch(() => null))?.metadata?.user_id
      : null) ??
    null;

  if (!userId) {
    console.error("No user_id on subscription", sub.id);
    return;
  }

  const plan: "monthly" | "lifetime" =
    sub.metadata?.plan === "lifetime" ? "lifetime" : "monthly";

  await upsertSubscription(
    userId,
    plan,
    sub.status,
    sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    typeof sub.customer === "string" ? sub.customer : null,
    sub.id,
  );
}

async function handleCanceled(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const userId = sub.metadata?.user_id ?? null;
  if (userId) {
    await upsertSubscription(
      userId,
      "monthly",
      "canceled",
      sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      typeof sub.customer === "string" ? sub.customer : null,
      sub.id,
    );
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event);
        break;
      case "customer.subscription.deleted":
        await handleCanceled(event);
        break;
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Handler error", err);
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }
});
