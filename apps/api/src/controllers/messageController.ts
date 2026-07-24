import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as messageService from '../services/messageService';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const message = await messageService.sendMessage(req.user.id, req.body.recipientId, req.body.body);
  res.status(201).json({ success: true, data: { message } });
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const conversations = await messageService.listConversations(req.user.id);
  res.status(200).json({ success: true, data: { conversations } });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const messages = await messageService.getConversation(req.user.id, req.params.partnerId);
  res.status(200).json({ success: true, data: { messages } });
});
