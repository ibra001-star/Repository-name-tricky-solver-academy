import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as studyPlanService from '../services/studyPlanService';

export const listMyPlanItems = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;
  const items = await studyPlanService.listMyPlanItems(req.user.id, from, to);
  res.status(200).json({ success: true, data: { items } });
});

export const createPlanItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const item = await studyPlanService.createPlanItem(req.user.id, req.body);
  res.status(201).json({ success: true, data: { item } });
});

export const updatePlanItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const item = await studyPlanService.updatePlanItem(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, data: { item } });
});

export const deletePlanItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await studyPlanService.deletePlanItem(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Study plan item deleted' });
});
