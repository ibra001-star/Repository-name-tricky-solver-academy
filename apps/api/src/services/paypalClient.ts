import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

// PayPal's own guidance (as of their SDK deprecation notice) is to integrate
// directly against the Orders v2 REST API rather than depend on the
// unmaintained @paypal/checkout-server-sdk package. These are just plain
// authenticated HTTP calls, so no SDK dependency is needed at all.
const PAYPAL_BASE_URL =
  env.PAYPAL_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

let cachedToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw AppError.badRequest('PayPal is not configured on this server');
  }

  const credentials = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    logger.error({ status: res.status }, 'Failed to obtain PayPal access token');
    throw AppError.internal('Unable to reach PayPal at this time. Please try again shortly.');
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
};

interface CreateOrderResult {
  orderId: string;
  approveUrl: string;
}

// Creates a PayPal Order in USD. The order references our internal payment
// ID via custom_id, which is how we tie the eventual capture back to our
// Payment row without trusting anything else PayPal sends us.
export const createPaypalOrder = async (params: {
  paymentId: string;
  amountUsd: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreateOrderResult> => {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: params.paymentId,
          description: params.description.slice(0, 127),
          amount: { currency_code: 'USD', value: params.amountUsd.toFixed(2) },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: 'Tricky Solver Academy',
        user_action: 'PAY_NOW',
      },
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
    message?: string;
  };

  if (!res.ok || !data.id) {
    logger.error({ status: res.status, data }, 'PayPal order creation failed');
    throw AppError.badRequest(data.message || 'Failed to create PayPal order. Please try again.');
  }

  const approveLink = data.links?.find((l) => l.rel === 'approve');
  if (!approveLink) {
    throw AppError.internal('PayPal did not return an approval URL');
  }

  return { orderId: data.id, approveUrl: approveLink.href };
};

interface CaptureOrderResult {
  status: string;
  captureId?: string;
}

// Captures (finalizes) a previously approved order. This is called after
// the customer approves the payment on PayPal's site and is redirected back.
export const capturePaypalOrder = async (orderId: string): Promise<CaptureOrderResult> => {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  const data = (await res.json()) as {
    status?: string;
    purchase_units?: Array<{ payments?: { captures?: Array<{ id: string }> } }>;
    message?: string;
  };

  if (!res.ok) {
    logger.error({ status: res.status, data }, 'PayPal order capture failed');
    throw AppError.badRequest(data.message || 'Failed to capture PayPal payment.');
  }

  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return { status: data.status ?? 'UNKNOWN', captureId };
};

// Verifies an incoming PayPal webhook signature via PayPal's verification
// endpoint (their recommended approach — there's no local HMAC verification
// for PayPal like Stripe offers, so we ask PayPal itself to confirm).
export const verifyPaypalWebhookSignature = async (
  headers: Record<string, string | string[] | undefined>,
  body: unknown
): Promise<boolean> => {
  if (!env.PAYPAL_WEBHOOK_ID) return false;

  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    }),
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
};
