import mongoose, { Schema, Document } from 'mongoose';

export interface PasswordEntryDocument extends Document {
  userId: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordEntrySchema = new Schema<PasswordEntryDocument>(
  {
    userId: { type: String, required: true, index: true },
    encryptedPayload: { type: String, required: true },
    encryptionVersion: { type: String, required: true }
  },
  { timestamps: true }
);

export const PasswordEntry = mongoose.model<PasswordEntryDocument>('PasswordEntry', PasswordEntrySchema);