import mongoose, { Schema, Document } from 'mongoose';

export interface CollectionDocument extends Document {
  userId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<CollectionDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String }
  },
  { timestamps: true }
);

export const Collection = mongoose.model<CollectionDocument>('Collection', CollectionSchema);

export interface CollectionItemDocument extends Document {
  userId: string;
  collectionId: string;
  itemType: 'text' | 'image' | 'video' | 'audio' | 'file';
  title: string;
  encryptedPayload: string;
  fileReferences?: string[];
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionItemSchema = new Schema<CollectionItemDocument>(
  {
    userId: { type: String, required: true, index: true },
    collectionId: { type: String, required: true, index: true },
    itemType: { type: String, enum: ['text', 'image', 'video', 'audio', 'file'], required: true },
    title: { type: String, required: true },
    encryptedPayload: { type: String, required: true },
    fileReferences: [{ type: String }],
    encryptionVersion: { type: String, required: true }
  },
  { timestamps: true }
);

export const CollectionItem = mongoose.model<CollectionItemDocument>('CollectionItem', CollectionItemSchema);