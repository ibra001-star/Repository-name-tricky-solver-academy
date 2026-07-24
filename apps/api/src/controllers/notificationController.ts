import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as notificationService from '../services/notificationService';

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const [notifications, unreadCount] = await Promise.all([
    notificationService.listMyNotifications(req.user.id),
    notificationService.getUnreadCount(req.user.id),
  ]);
  res.status(200).json({ success: true, data: { notifications, unreadCount } });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { notification } });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await notificationService.markAllAsRead(req.user.id);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});
