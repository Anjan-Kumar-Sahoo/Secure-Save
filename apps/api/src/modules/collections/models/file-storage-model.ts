import mongoose, { Schema, Document } from 'mongoose';

export interface StoredFileDocument extends Document {
  userId: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  encryptedChecksum?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoredFileSchema = new Schema<StoredFileDocument>(
  {
    userId: { type: String, required: true, index: true },
    originalFileName: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    sizeBytes: { type: Number, required: true },
    encryptedChecksum: { type: String }
  },
  { timestamps: true }
);

export const StoredFile = mongoose.model<StoredFileDocument>('StoredFile', StoredFileSchema);
