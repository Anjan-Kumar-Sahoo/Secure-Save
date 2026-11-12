import mongoose, { Schema, Document } from 'mongoose';

export interface OtpDocument extends Document {
  email: string;
  purpose: 'registration' | 'login' | 'pin-reset';
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt?: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<OtpDocument>(
  {
    email: { type: String, required: true, index: true },
    purpose: { type: String, enum: ['registration', 'login', 'pin-reset'], required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '1h' } },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Otp = mongoose.model<OtpDocument>('Otp', OtpSchema);