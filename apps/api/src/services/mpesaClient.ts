import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

const DARAJA_BASE_URL =
  env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

// Daraja OAuth tokens are valid for ~1 hour. Caching in-process avoids
// requesting a new token on every STK push, which would otherwise add
// unnecessary latency and risk hitting Safaricom's rate limits.
let cachedToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!env.MPESA_CONSUMER_KEY || !env.MPESA_CONSUMER_SECRET) {
    throw AppError.badRequest('M-Pesa is not configured on this server');
  }

  const credentials = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString('base64');

  const res = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    logger.error({ status: res.status }, 'Failed to obtain M-Pesa access token');
    throw AppError.internal('Unable to reach M-Pesa at this time. Please try again shortly.');
  }

  const data = (await res.json()) as { access_token: string; expires_in: string };
  cachedToken = {
    token: data.access_token,
    // Refresh 60s early to avoid a request failing right at expiry.
    expiresAt: Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000,
  };

  return cachedToken.token;
};

// Daraja requires phone numbers in the exact format 2547XXXXXXXX / 2541XXXXXXXX.
export const normalizeKenyanPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.startsWith('7') || digits.startsWith('1')) return `254${digits}`;
  throw AppError.badRequest('Invalid Kenyan phone number format');
};

const getTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
};

interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

// Initiates an STK Push prompt on the customer's phone. `accountReference`
// and `transactionDesc` show up on the phone's payment prompt, so they're
// kept short and human-readable (e.g. "TSA-SUB-MONTHLY").
export const initiateStkPush = async (params: {
  phone: string;
  amountKes: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<StkPushResult> => {
  if (!env.MPESA_SHORTCODE || !env.MPESA_PASSKEY || !env.MPESA_CALLBACK_URL) {
    throw AppError.badRequest('M-Pesa is not configured on this server');
  }

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`).toString('base64');
  const phone = normalizeKenyanPhone(params.phone);

  // M-Pesa requires whole-shilling amounts (no decimals).
  const amount = Math.max(1, Math.round(params.amountKes));

  const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference.slice(0, 20),
      TransactionDesc: params.transactionDesc.slice(0, 20),
    }),
  });

  const data = (await res.json()) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    CustomerMessage?: string;
    errorMessage?: string;
    errorCode?: string;
  };

  if (!res.ok || !data.CheckoutRequestID) {
    logger.error({ status: res.status, data }, 'M-Pesa STK push failed');
    throw AppError.badRequest(data.errorMessage || 'Failed to initiate M-Pesa payment. Please try again.');
  }

  return {
    merchantRequestId: data.MerchantRequestID!,
    checkoutRequestId: data.CheckoutRequestID!,
    responseCode: data.ResponseCode!,
    responseDescription: data.ResponseDescription!,
    customerMessage: data.CustomerMessage!,
  };
};

// Queries the status of a previously initiated STK push — useful as a
// fallback if the callback is delayed or lost, so the client can poll.
export const queryStkPushStatus = async (checkoutRequestId: string) => {
  if (!env.MPESA_SHORTCODE || !env.MPESA_PASSKEY) {
    throw AppError.badRequest('M-Pesa is not configured on this server');
  }

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`).toString('base64');

  const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  return res.json() as Promise<{ ResultCode?: string; ResultDesc?: string }>;
};
