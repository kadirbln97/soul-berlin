import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Lazy-init, damit die App auch ohne Stripe-Key startet (z.B. wenn nur Gästelisten genutzt werden). */
export function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY fehlt in .env — wird für kostenpflichtige Events benötigt."
      );
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2024-06-20"
    });
  }
  return stripeClient;
}
