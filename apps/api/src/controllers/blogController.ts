import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as blogService from '../services/blogService';

export const listPublishedPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const result = await blogService.listPublishedPosts(page, limit);
  res.status(200).json({ success: true, data: result });
});

export const getPostBySlug = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.getPostBySlug(req.params.slug);
  res.status(200).json({ success: true, data: { post } });
});

export const listAllPostsForAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await blogService.listAllPostsForAdmin();
  res.status(200).json({ success: true, data: { posts } });
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const post = await blogService.createPost(req.user.id, req.body);
  res.status(201).json({ success: true, data: { post } });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.updatePost(req.params.id, req.body);
  res.status(200).json({ success: true, data: { post } });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await blogService.deletePost(req.params.id);
  res.status(200).json({ success: true, message: 'Blog post deleted' });
});
