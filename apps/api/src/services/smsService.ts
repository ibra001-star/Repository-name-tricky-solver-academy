import AfricasTalking from 'africastalking';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { normalizeKenyanPhone } from './mpesaClient';

const isConfigured = !!(env.AFRICASTALKING_API_KEY && env.AFRICASTALKING_USERNAME);

const client = isConfigured
  ? AfricasTalking({ apiKey: env.AFRICASTALKING_API_KEY, username: env.AFRICASTALKING_USERNAME })
  : null;

// SMS is always best-effort: a failed text should never break the calling
// flow (e.g. an exam reminder job, a payment confirmation) — it's a
// convenience channel layered on top of the in-app/email notifications
// that already exist, not a critical path.
export const sendSms = async (phone: string, message: string): Promise<void> => {
  if (!client) {
    logger.info({ phone, message }, "📱 [DEV SMS — not sent, Africa's Talking not configured]");
    return;
  }

  try {
    const normalizedPhone = `+${normalizeKenyanPhone(phone)}`;
    await client.SMS.send({ to: [normalizedPhone], message, from: undefined });
  } catch (err) {
    logger.error({ err, phone }, 'Failed to send SMS (non-fatal)');
  }
};

export const sendExamReminderSms = async (
  phone: string,
  examTitle: string,
  minutesUntilStart: number
): Promise<void> => {
  await sendSms(phone, `Tricky Solver Academy: "${examTitle}" starts in ${minutesUntilStart} minutes. Good luck!`);
};

export const sendPaymentConfirmationSms = async (phone: string, amountKes: number): Promise<void> => {
  await sendSms(phone, `Tricky Solver Academy: Payment of KES ${amountKes.toLocaleString()} received. Thank you!`);
};
