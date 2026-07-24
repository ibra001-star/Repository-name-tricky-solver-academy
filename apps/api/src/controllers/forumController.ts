import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as forumService from '../services/forumService';
import { ListThreadsQuery } from '../utils/validators/communityValidators';

export const listThreads = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListThreadsQuery;
  const result = await forumService.listThreads(query);
  res.status(200).json({ success: true, data: result });
});

export const getThread = asyncHandler(async (req: Request, res: Response) => {
  const thread = await forumService.getThread(req.params.id);
  res.status(200).json({ success: true, data: { thread } });
});

export const createThread = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const thread = await forumService.createThread(req.user.id, req.body);
  res.status(201).json({ success: true, data: { thread } });
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const post = await forumService.createPost(req.params.id, req.user.id, req.body.body);
  res.status(201).json({ success: true, data: { post } });
});

export const deleteThread = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await forumService.deleteThread(req.params.id, req.user);
  res.status(200).json({ success: true, message: 'Thread deleted' });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await forumService.deletePost(req.params.id, req.user);
  res.status(200).json({ success: true, message: 'Post deleted' });
});

export const moderateThread = asyncHandler(async (req: Request, res: Response) => {
  const thread = await forumService.setThreadModeration(req.params.id, req.body);
  res.status(200).json({ success: true, data: { thread } });
});
