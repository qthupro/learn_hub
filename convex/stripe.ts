"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

// The Stripe SDK needs Node, so everything that calls it lives here; this file may only export
// actions.

function requireEnv(name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET" | "SITE_URL") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it with \`npx convex env set ${name} <value>\`.`);
  }
  return value;
}

let client: Stripe | null = null;
function stripe() {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return client;
}

/** Starts a Stripe Checkout for a paid course and returns the URL to send the student to. */
export const createCheckoutSession = action({
  args: { courseId: v.id("courses") },
  returns: v.string(),
  handler: async (ctx, { courseId }): Promise<string> => {
    const { userId, email, course } = await ctx.runQuery(internal.enrollments.getCheckoutContext, { courseId });
    const siteUrl = requireEnv("SITE_URL").replace(/\/+$/, "");

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: course.priceCents,
            product_data: { name: course.title },
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      customer_email: email,
      metadata: { userId, courseId },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/courses/${encodeURIComponent(course.slug)}`,
    });
    if (session.url === null) {
      throw new Error(`Stripe returned no URL for Checkout Session ${session.id}`);
    }

    // Recorded before the student can pay, so the webhook always finds it.
    await ctx.runMutation(internal.enrollments.recordCheckout, {
      stripeSessionId: session.id,
      userId,
      courseId,
      amountCents: course.priceCents,
    });
    return session.url;
  },
});

const fulfillmentEvents = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

/**
 * Verifies and handles one Stripe webhook delivery. Returns false when the signature is invalid.
 * Throws when fulfillment fails, so the HTTP action errors and Stripe retries the event.
 */
export const handleWebhook = internalAction({
  args: { body: v.string(), signature: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { body, signature }) => {
    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(body, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
    } catch (error) {
      console.warn("Rejected Stripe webhook:", error instanceof Error ? error.message : error);
      return false;
    }
    if (!fulfillmentEvents.has(event.type)) {
      return true;
    }

    // Re-fetch rather than trusting the event payload, as Stripe's fulfillment guide recommends.
    const sessionId = (event.data.object as Stripe.Checkout.Session).id;
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    // Delayed payment methods complete as "unpaid"; async_payment_succeeded follows when they clear.
    if (session.payment_status === "unpaid") {
      return true;
    }
    const result = await ctx.runMutation(internal.enrollments.fulfillCheckout, {
      stripeSessionId: session.id,
      amountPaidCents: session.amount_total ?? 0,
    });
    console.log(`Stripe ${event.type} for ${session.id}: ${result}`);
    return true;
  },
});
