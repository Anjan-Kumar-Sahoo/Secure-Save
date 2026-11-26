import { Response } from 'express';
import { CollectionItem } from '../models/collection-model';
import { StoredFile } from '../models/file-storage-model';
import { fileStorageService } from '../services/file-storage-service';
import { asyncHandler, AppError } from '../../../utils/error-handler';

// Maximum upload payload limit (e.g. 50MB)
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/**
 * Upload an encrypted file attachment
 * Expects JSON: { fileName, mimeType, encryptedBase64 }
 */
export const uploadEncryptedFile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { fileName, mimeType, encryptedBase64 } = req.body;

  if (!fileName || !encryptedBase64) {
    throw new AppError('fileName and encryptedBase64 are required', 400, 'BAD_REQUEST', 'UploadFile');
  }

  // Decode base64 buffer
  const buffer = Buffer.from(encryptedBase64, 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new AppError(`File size exceeds maximum permitted limit (${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`, 400, 'PAYLOAD_TOO_LARGE', 'UploadLimit');
  }

  // Save to secure local encrypted storage
  const { storageKey, size } = await fileStorageService.saveEncryptedFile(userId, buffer);

  // Store metadata
  const storedFile = await StoredFile.create({
    userId,
    originalFileName: fileName,
    storageKey,
    mimeType: mimeType || 'application/octet-stream',
    sizeBytes: size,
  });

  res.json({
    success: true,
    message: 'Encrypted file uploaded successfully',
    data: {
      fileId: storedFile._id,
      storageKey: storedFile.storageKey,
      fileName: storedFile.originalFileName,
      sizeBytes: storedFile.sizeBytes,
      mimeType: storedFile.mimeType,
    }
  });
});

/**
 * Download encrypted file attachment by storageKey or fileId
 */
export const downloadEncryptedFile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { fileId } = req.params;

  const storedFile = await StoredFile.findOne({ _id: fileId, userId });
  if (!storedFile) {
    throw new AppError('File record not found', 404, 'NOT_FOUND', 'DownloadFile');
  }

  const encryptedBuffer = await fileStorageService.getEncryptedFile(userId, storedFile.storageKey);

  res.json({
    success: true,
    message: 'Encrypted file retrieved successfully',
    data: {
      fileName: storedFile.originalFileName,
      mimeType: storedFile.mimeType,
      sizeBytes: storedFile.sizeBytes,
      encryptedBase64: encryptedBuffer.toString('base64'),
    }
  });
});
