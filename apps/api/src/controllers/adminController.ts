import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as adminService from '../services/adminService';
import { ListUsersQuery, ListAuditLogsQuery } from '../utils/validators/adminValidators';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListUsersQuery;
  const result = await adminService.listUsers(query);
  res.status(200).json({ success: true, data: result });
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await adminService.setUserActive(req.params.id, req.body.isActive, req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

export const setUserRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await adminService.setUserRole(req.params.id, req.body.role, req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

export const getRevenueSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await adminService.getRevenueSummary();
  res.status(200).json({ success: true, data: { summary } });
});

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getPlatformStats();
  res.status(200).json({ success: true, data: { stats } });
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListAuditLogsQuery;
  const result = await adminService.listAuditLogs(query);
  res.status(200).json({ success: true, data: result });
});
