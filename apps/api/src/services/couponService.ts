import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export const validateCoupon = async (code: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) {
    throw AppError.badRequest('This coupon code is invalid');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw AppError.badRequest('This coupon code has expired');
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw AppError.badRequest('This coupon code has reached its usage limit');
  }

  return coupon;
};

// Called only once a payment actually succeeds — never on initiation, so an
// abandoned STK push or a failed card charge doesn't burn a redemption.
export const incrementCouponUsage = async (couponId: string) => {
  await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
};

export const createCoupon = async (input: {
  code: string;
  discountPercent: number;
  maxUses?: number;
  expiresAt?: string;
}) => {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) throw AppError.conflict('A coupon with this code already exists');

  return prisma.coupon.create({
    data: {
      code: input.code,
      discountPercent: input.discountPercent,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    },
  });
};

export const listCoupons = async () => {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
};

export const setCouponActive = async (id: string, isActive: boolean) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Coupon not found');
  return prisma.coupon.update({ where: { id }, data: { isActive } });
};
