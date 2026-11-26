/**
 * Secure Save - Shared Domain Types and API Contracts
 * Single source of truth across Backend, Web Application, and Mobile Application
 */

// ==========================================
// 1. Generic API Response Envelope
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

// ==========================================
// 2. User & Session Models
// ==========================================
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  status: 'active' | 'pending' | 'locked';
}

export interface UserProfile {
  id?: string;
  email: string;
}

export interface AuthSessionResponse {
  user: UserProfile;
  token: string;
}

export interface AccountLookupResponse {
  exists: boolean;
  isRegistered?: boolean;
  emailVerified?: boolean;
}

// ==========================================
// 3. Vault Item Types & Payloads
// ==========================================

// --- Passwords ---
export interface DecryptedPasswordData {
  title: string;
  username?: string;
  email?: string;
  password: string;
  websiteUrl?: string;
  notes?: string;
}

export interface PasswordRecord {
  _id: string;
  id?: string;
  userId: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedPasswordData;
}

// --- Cards ---
export interface DecryptedCardData {
  cardHolderName: string;
  cardNumber: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  bankName?: string;
  nickname?: string;
  notes?: string;
}

export interface CardRecord {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedCardData;
}

// --- Banks ---
export interface DecryptedBankData {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode?: string;
  routingNumber?: string;
  swiftBic?: string;
  accountType?: 'checking' | 'savings' | 'current' | 'other';
  notes?: string;
}

export interface BankRecord {
  _id: string;
  id?: string;
  userId: string;
  encryptedPayload: string;
  linkedCardIds?: string[];
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedBankData;
}

// --- Collections & Items ---
export type CollectionItemType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface DecryptedCollectionItemData {
  title: string;
  content?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

export interface CollectionRecord {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItemRecord {
  _id: string;
  id?: string;
  userId: string;
  collectionId: string;
  itemType: CollectionItemType;
  title: string;
  encryptedPayload: string;
  fileReferences?: string[];
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedCollectionItemData;
}

// Backward compatibility interfaces matching original naming
export type Card = CardRecord;
export type BankDetail = BankRecord;
export type PasswordEntry = PasswordRecord;
export type Collection = CollectionRecord;
export type CollectionItem = CollectionItemRecord;

// ==========================================
// 4. Client Crypto Options
// ==========================================
export interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}
