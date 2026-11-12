export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'pending' | 'locked';
}

export type CollectionItemType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface Card {
  id: string;
  userId: string;
  title: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDetail {
  id: string;
  userId: string;
  encryptedPayload: string;
  linkedCardIds: string[];
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordEntry {
  id: string;
  userId: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionItem {
  id: string;
  userId: string;
  collectionId: string;
  itemType: CollectionItemType;
  title: string;
  encryptedPayload: string;
  fileReferences?: string[];
  encryptionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}
