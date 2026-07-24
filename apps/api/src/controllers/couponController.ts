import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as couponService from '../services/couponService';

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  res.status(201).json({ success: true, data: { coupon } });
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.listCoupons();
  res.status(200).json({ success: true, data: { coupons } });
});

export const setCouponActive = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.setCouponActive(req.params.id, req.body.isActive);
  res.status(200).json({ success: true, data: { coupon } });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.validateCoupon(req.body.code);
  res.status(200).json({
    success: true,
    data: { valid: true, discountPercent: coupon.discountPercent },
  });
});
