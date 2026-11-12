import mongoose, { Schema, Document } from 'mongoose';

export interface BankDetailDocument extends Document {
  userId: string;
  encryptedPayload: string;
  linkedCardIds: string[];
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const BankDetailSchema = new Schema<BankDetailDocument>(
  {
    userId: { type: String, required: true, index: true },
    encryptedPayload: { type: String, required: true },
    linkedCardIds: [{ type: String, ref: 'Card' }],
    encryptionVersion: { type: String, required: true }
  },
  { timestamps: true }
);

export const BankDetail = mongoose.model<BankDetailDocument>('BankDetail', BankDetailSchema);