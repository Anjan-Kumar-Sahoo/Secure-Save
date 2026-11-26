import mongoose, { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'pending' | 'locked';
  encryptionKeyVersion: number;
  recoveryConfiguration: {
    recoveryKeyId: string;
    recoveryKeyVersion: number;
    recoveryKeyEncrypted: string;
  };
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'pending', 'locked'], default: 'pending' },
    encryptionKeyVersion: { type: Number, default: 1 },
    recoveryConfiguration: {
      recoveryKeyId: { type: String, required: true },
      recoveryKeyVersion: { type: Number, required: true },
      recoveryKeyEncrypted: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', UserSchema);