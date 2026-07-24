import { z } from 'zod';

// Kenyan phone numbers for M-Pesa: accepts 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX,
// 2541XXXXXXXX, or +254 variants — normalized server-side to 2547XXXXXXXX / 2541XXXXXXXX
// before hitting Daraja, which only accepts that exact format.
const kenyanPhoneRegex = /^(?:\+?254|0)((7|1)\d{8})$/;

export const initiateSubscriptionSchema = z.object({
  plan: z.enum(['MONTHLY', 'YEARLY', 'LIFETIME']),
  provider: z.enum(['MPESA', 'STRIPE', 'PAYPAL']),
  couponCode: z.string().trim().toUpperCase().optional(),
  phone: z.string().regex(kenyanPhoneRegex, 'Enter a valid Kenyan phone number').optional(),
});

export const initiatePaperPurchaseSchema = z.object({
  examId: z.string().uuid(),
  provider: z.enum(['MPESA', 'STRIPE', 'PAYPAL']),
  couponCode: z.string().trim().toUpperCase().optional(),
  phone: z.string().regex(kenyanPhoneRegex, 'Enter a valid Kenyan phone number').optional(),
});

export const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});

export const capturePaypalOrderSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().uuid(),
});

export const createCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(30),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(1),
});

export type InitiateSubscriptionInput = z.infer<typeof initiateSubscriptionSchema>;
export type InitiatePaperPurchaseInput = z.infer<typeof initiatePaperPurchaseSchema>;
