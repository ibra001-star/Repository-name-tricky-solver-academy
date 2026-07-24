import { Readable } from 'stream';
import { UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from './cloudinaryClient';
import { AppError } from '../utils/AppError';

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

// Cloudinary's Node SDK expects a stream, not a Buffer, for its upload_stream
// API — this bridges multer's in-memory Buffer into a readable stream Cloudinary can consume.
const bufferToStream = (buffer: Buffer): Readable => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

export const uploadBuffer = (
  buffer: Buffer,
  options: { folder: string; resourceType?: 'image' | 'raw' | 'auto' }
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured) {
    return Promise.reject(AppError.badRequest('File storage is not configured on this server'));
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `tricky-solver-academy/${options.folder}`,
        resource_type: options.resourceType ?? 'auto',
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(AppError.internal('File upload failed. Please try again.'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id, format: result.format, bytes: result.bytes });
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

export const deleteFile = async (publicId: string, resourceType: 'image' | 'raw' = 'raw'): Promise<void> => {
  if (!isCloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
    // Best-effort cleanup — a failed delete shouldn't block the calling operation.
  });
};
