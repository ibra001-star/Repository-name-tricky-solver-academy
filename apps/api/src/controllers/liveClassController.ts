import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as liveClassService from '../services/liveClassService';

export const listUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
  const classes = await liveClassService.listUpcoming(subject);
  res.status(200).json({ success: true, data: { classes } });
});

export const listAllForStaff = asyncHandler(async (_req: Request, res: Response) => {
  const classes = await liveClassService.listAllForStaff();
  res.status(200).json({ success: true, data: { classes } });
});

export const createLiveClass = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const liveClass = await liveClassService.createLiveClass(req.user.id, req.body);
  res.status(201).json({ success: true, data: { liveClass } });
});

export const updateLiveClass = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const liveClass = await liveClassService.updateLiveClass(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: { liveClass } });
});

export const deleteLiveClass = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await liveClassService.deleteLiveClass(req.params.id, req.user);
  res.status(200).json({ success: true, message: 'Live class deleted' });
});
