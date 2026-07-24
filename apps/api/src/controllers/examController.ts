import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as examService from '../services/examService';
import { ListExamsQuery } from '../utils/validators/examValidators';

export const listExams = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListExamsQuery;
  const result = await examService.listExams(query, req.user ?? null);
  res.status(200).json({ success: true, data: result });
});

export const getExamForTaking = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examService.getExamForTaking(req.params.id, req.user?.id ?? null);
  res.status(200).json({ success: true, data: { exam } });
});

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const exam = await examService.createExam(req.body, req.user.id);
  res.status(201).json({ success: true, data: { exam } });
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const exam = await examService.updateExam(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: { exam } });
});

export const setPublished = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examService.setExamPublished(req.params.id, req.body.isPublished);
  res.status(200).json({ success: true, data: { exam } });
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await examService.deleteExam(req.params.id, req.user);
  res.status(200).json({ success: true, message: 'Exam deleted' });
});
