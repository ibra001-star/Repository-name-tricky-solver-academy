import Stripe from 'stripe';
import { env } from '../config/env';

// A single Stripe client instance, matching the pattern used for Prisma —
// avoids reconstructing the SDK (and its internal HTTP agent) on every request.
// No apiVersion is pinned explicitly: stripe-node v22 automatically targets
// the API version it was released against, which is the documented default
// behavior for typed SDKs (pinning manually risks a mismatch with the SDK's
// own TypeScript types).
export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
