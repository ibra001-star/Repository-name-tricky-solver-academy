import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as certificateService from '../services/certificateService';

export const getCertificate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const certificate = await certificateService.getOrCreateCertificate(req.params.attemptId, req.user.id);
  res.status(200).json({ success: true, data: { certificate } });
});

export const listMyDownloads = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const downloads = await certificateService.listMyDownloads(req.user.id);
  res.status(200).json({ success: true, data: { downloads } });
});
