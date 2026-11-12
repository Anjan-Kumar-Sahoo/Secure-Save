import mongoose, { Schema, Document } from 'mongoose';

export interface CardDocument extends Document {
  userId: string;
  title: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<CardDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    encryptedPayload: { type: String, required: true },
    encryptionVersion: { type: String, required: true }
  },
  { timestamps: true }
);

export const Card = mongoose.model<CardDocument>('Card', CardSchema);