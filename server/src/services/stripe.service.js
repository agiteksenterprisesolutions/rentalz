import Stripe from "stripe";
import { ApiError } from "../utils/error.js";

let client = null;

/** Lazy client so the API boots (and everything else works) before Stripe keys are configured. */
export const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) throw new ApiError("Payments are not configured", 503);
    client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
    return client;
};

export const constructWebhookEvent = (rawBody, signature) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new ApiError("Webhook secret is not configured", 503);
    return Stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET); // static: no API key needed
};

/** Stripe amounts are integers in the smallest currency unit (fils for AED). */
export const toMinorUnits = (amount) => Math.round(Number(amount) * 100);
