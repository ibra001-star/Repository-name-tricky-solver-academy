import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as newsletterService from '../services/newsletterService';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  await newsletterService.subscribe(req.body.email);
  res.status(200).json({ success: true, message: 'Subscribed successfully' });
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  await newsletterService.unsubscribe(req.body.email);
  res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
});
