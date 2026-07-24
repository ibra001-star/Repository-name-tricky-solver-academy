import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as referralService from '../services/referralService';

export const getMyReferralCode = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const code = await referralService.getOrCreateReferralCode(req.user.id);
  res.status(200).json({ success: true, data: { referralCode: code } });
});

export const getMyReferralStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const stats = await referralService.getReferralStats(req.user.id);
  res.status(200).json({ success: true, data: { stats } });
});
