import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as teacherUploadService from '../services/teacherUploadService';
import { createUploadMetaSchema, reviewUploadSchema } from '../utils/validators/uploadValidators';

export const createUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.file) throw AppError.badRequest('A file is required');

  const input = createUploadMetaSchema.parse(req.body);
  const upload = await teacherUploadService.createTeacherUpload(req.user.id, input, req.file);
  res.status(201).json({ success: true, data: { upload } });
});

export const listMyUploads = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const uploads = await teacherUploadService.listMyUploads(req.user.id);
  res.status(200).json({ success: true, data: { uploads } });
});

export const listPendingUploads = asyncHandler(async (_req: Request, res: Response) => {
  const uploads = await teacherUploadService.listPendingUploads();
  res.status(200).json({ success: true, data: { uploads } });
});

export const reviewUpload = asyncHandler(async (req: Request, res: Response) => {
  const decision = reviewUploadSchema.parse(req.body);
  const upload = await teacherUploadService.reviewUpload(req.params.id, decision);
  res.status(200).json({ success: true, data: { upload } });
});

export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await teacherUploadService.deleteUpload(req.params.id, req.user);
  res.status(200).json({ success: true, message: 'Upload deleted' });
});

export const listApprovedUploads = asyncHandler(async (req: Request, res: Response) => {
  const subjectArea = typeof req.query.subjectArea === 'string' ? req.query.subjectArea : undefined;
  const uploads = await teacherUploadService.listApprovedUploads(subjectArea);
  res.status(200).json({ success: true, data: { uploads } });
});
