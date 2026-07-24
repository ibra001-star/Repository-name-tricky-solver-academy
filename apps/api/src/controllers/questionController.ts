import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as questionService from '../services/questionService';
import { ListQuestionsQuery } from '../utils/validators/questionValidators';

export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListQuestionsQuery;
  const result = await questionService.listQuestions(query, req.user ?? null);
  res.status(200).json({ success: true, data: result });
});

export const getQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await questionService.getQuestionById(req.params.id, req.user ?? null);
  res.status(200).json({ success: true, data: { question } });
});

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const question = await questionService.createQuestion(req.body, req.user.id);
  res.status(201).json({ success: true, data: { question } });
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const question = await questionService.updateQuestion(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: { question } });
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await questionService.deleteQuestion(req.params.id, req.user);
  res.status(200).json({ success: true, message: 'Question deleted' });
});

export const setApproval = asyncHandler(async (req: Request, res: Response) => {
  const question = await questionService.setQuestionApproval(req.params.id, req.body.isApproved);
  res.status(200).json({ success: true, data: { question } });
});

export const listPending = asyncHandler(async (_req: Request, res: Response) => {
  const questions = await questionService.listPendingQuestions();
  res.status(200).json({ success: true, data: { questions } });
});

export const toggleBookmark = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const result = await questionService.toggleBookmark(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const listBookmarks = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const bookmarks = await questionService.listBookmarks(req.user.id);
  res.status(200).json({ success: true, data: { bookmarks } });
});
