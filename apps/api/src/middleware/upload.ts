import multer from 'multer';
import { AppError } from '../utils/AppError';

// Memory storage: files are held as a Buffer in req.file, never written to
// local disk, then streamed straight to Cloudinary. This keeps the API
// stateless (safe to run multiple replicas behind a load balancer) and
// avoids leaving orphaned temp files if a request is interrupted.
const storage = multer.memoryStorage();

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB — revision papers can be image-heavy PDFs
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      cb(AppError.badRequest('Only PDF and Word documents are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(AppError.badRequest('Only JPEG, PNG, WebP, and GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');
