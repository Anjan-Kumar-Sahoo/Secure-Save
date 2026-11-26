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
  vaultKeyConfiguration?: {
    kdfAlgorithm?: string;    // 'PBKDF2-SHA256'
    kekSalt: string;          // Hex/Base64 salt for PBKDF2 Master Password -> KEK derivation
    wrappedDek: string;       // AES-256-GCM ciphertext of raw DEK encrypted by KEK
    keyVersion: number;       // Version (2 for new architecture)
    iterations?: number;      // PBKDF2 iterations (default 600,000 as per OWASP)
    // User-Controlled Master Password Recovery Configuration
    recoveryWrappedDek?: string; // AES-256-GCM ciphertext of raw DEK encrypted by User Recovery Key
    recoverySalt?: string;       // Salt for deriving recovery KEK from recovery phrase/key
    createdAt: Date;
    updatedAt: Date;
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
    },
    vaultKeyConfiguration: {
      kdfAlgorithm: { type: String, default: 'PBKDF2-SHA256' },
      kekSalt: { type: String },
      wrappedDek: { type: String },
      keyVersion: { type: Number, default: 2 },
      iterations: { type: Number, default: 600000 },
      recoveryWrappedDek: { type: String },
      recoverySalt: { type: String },
      createdAt: { type: Date },
      updatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', UserSchema);