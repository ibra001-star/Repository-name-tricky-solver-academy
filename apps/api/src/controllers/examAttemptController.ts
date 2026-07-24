import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as attemptService from '../services/examAttemptService';

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const attempt = await attemptService.startAttempt(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { attempt } });
});

export const autosaveAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const attempt = await attemptService.autosaveAnswer(
    req.params.attemptId,
    req.user.id,
    req.body.questionId,
    req.body.response
  );
  res.status(200).json({ success: true, data: { attempt } });
});

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const attempt = await attemptService.submitAttempt(
    req.params.attemptId,
    req.user.id,
    req.body.answers as Record<string, unknown> | undefined
  );
  res.status(200).json({ success: true, data: { attempt } });
});

export const getAttemptResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const result = await attemptService.getAttemptResult(req.params.attemptId, req.user.id);
  res.status(200).json({ success: true, data: { result } });
});

export const listMyAttempts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const attempts = await attemptService.listMyAttempts(req.user.id);
  res.status(200).json({ success: true, data: { attempts } });
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const leaderboard = await attemptService.getExamLeaderboard(req.params.id);
  res.status(200).json({ success: true, data: { leaderboard } });
});

export const getPlatformLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
  const leaderboard = await attemptService.getPlatformLeaderboard();
  res.status(200).json({ success: true, data: { leaderboard } });
});
