# Secure Save - System Architecture

## High-Level Architecture

```
secure-save/
├── apps/
│   ├── api/              - Node.js + Express + MongoDB Atlas
│   └── mobile/           - React + Vite + TypeScript + Tailwind CSS
│       └── Capacitor     - Android APK packaging
│
├── packages/
│   └── shared-types/     - TypeScript interfaces and contracts
│
└── docs/                - 15+ architecture and user guides
```

### Component Responsibilities

#### Frontend (React + Capacitor)
- **User Interface**: All visual components, screens, and navigation
- **Client-Side Encryption**: AES-256-GCM encryption/decryption before data leaves device
- **Auth State Management**: JWT token storage, PIN validation, session handling
- **Local Vault Unlock**: Android Keystore-backed protection
- **Media Capture**: Camera, microphone, file picker integration
- **APK Packaging**: Capacitor native bridge, native permission handling

#### Backend (Node.js + Express)
- **API Layer**: REST endpoints at `/api/v1`
- **Authentication**: OTP verification, JWT session management
- **Business Logic**: CRUD operations for all vault data
- **Encryption Orchestration**: Key wrapping, payload encryption/decryption
- **Email Service**: SMTP OTP delivery, professional HTML templates
- **Database Operations**: MongoDB Atlas queries with proper indexing

#### Database (MongoDB Atlas)
- **users**: Account credentials, encryption key versioning, recovery config
- **otp_challenges**: Verification codes with TTL indexes
- **sessions**: JWT refresh tokens, device metadata
- **cards**: Encrypted payloads, user references
- **bank_details**: Encrypted payloads, linked card references
- **passwords**: Encrypted payloads
- **collections**: User-defined folders with metadata
- **collection_items**: Text, image, video, audio, file entries
- **stored_files**: Object storage metadata, checksums, mime types

#### External Services
- **MongoDB Atlas**: Cloud database with encrypted connections (TLS)
- **SMTP Email**: OTP delivery, verification notices
- **Android Keystore**: Hardware-backed key protection
- **Object Storage**: Encrypted media repository (configurable provider)

## Data Flow Diagrams

### Authentication Flow

```
User → React Frontend
  │
  ├── Registration:
  │   1. Email input → POST /api/auth/register
  │   2. Backend sends OTP via SMTP
  │   3. User enters OTP → POST /api/auth/verify-otp
  │   4. Backend validates OTP → User creates PIN
  │   5. Vault key generated client-side
  │   6. PIN hashed with bcrypt, stored encrypted
  │   7. JWT issued, session established
  │
  └── Login:
      1. Email + PIN → POST /api/auth/login
      2. Backend validates PIN against hashed recovery key
      3. JWT issued if valid
      4. Frontend decrypts vault key with PIN
      5. App unlocks, dashboard displayed
```

### Card Data Flow

```
User → React Frontend (Client-Side Encryption)
  │
  ├── Input form → AES-256-GCM encryption
  │   - Generate random key per operation
  │   - IV + auth tag + ciphertext
  │   - Key wrapped with Android Keystore
  │
  ├── encryptedPayload → POST /api/cards
  │
  └── MongoDB Atlas:
      - stored: encryptedPayload (base64)
      - never: plaintext card data
```

### Collection Item Flow (Image Example)

```
User → React Frontend
  │
  1. Select image from gallery
  │
  ├── Compress/resize if needed
  │
  ├── encrypt locally (AES-256-GCM)
  │   - Random IV, auth tag
  │   - Key from vault + Android Keystore
  │
  ├── POST /api/files/upload-init → authorized upload
  │
  ├── Encrypted upload → Object Storage
  │   - Short-lived signed URL
  │   - No permanent public URLs
  │
  ├── POST /api/files/upload-complete
  │
  └── MongoDB:
      - stored_files collection:
        • storageKey (unique identifier)
        • encryptedFileMetadata
        • mimeType, size, checksum
        • collectionId reference
        • createdAt
│
  └── Collection item record:
      - encryptedPayload (empty/placeholder)
      - fileReferences: [storageKey]
      - itemType: "image"
      - title, description
```

## Component Responsibilities

### 1. Authentication Module
- **Routes**: `/api/auth/*`
- **Controllers**: register, sendOtp, verifyOtp, createPin, loginPin, forgotPin, resetPin, logout
- **Models**: User, OTP Challenge
- **Services**: OTP generation/verification, email sending, password hashing
- **Middleware**: authenticateToken, rate limiting, input validation

### 2. Cards Module
- **Routes**: `/api/cards/*`
- **Controllers**: getCards, createCard, getCard, updateCard, deleteCard
- **Models**: Card (with encryptedPayload)
- **Services**: AES-256-GCM encryption/decryption, key management
- **Validation**: Card number format, expiry date, CVV validation

### 3. Bank Details Module
- **Routes**: `/api/banks/*`
- **Controllers**: getBanks, createBank, getBank, updateBank, deleteBank, linkCard, unlinkCard
- **Models**: BankDetail (with encryptedPayload, linkedCardIds)
- **Services**: Encryption, key management, reference handling
- **Validation**: Bank account number format, custom field rules

### 4. Passwords Module
- **Routes**: `/api/passwords/*`
- **Controllers**: getPasswords, createPassword, getPassword, updatePassword, deletePassword
- **Models**: PasswordEntry (with encryptedPayload)
- **Services**: Encryption, password generator, clipboard handling
- **Validation**: Password strength, email format, URL validation

### 5. Collections Module
- **Routes**: `/api/collections/*`
- **Controllers**: getCollections, createCollection, getCollection, updateCollection, deleteCollection
- **Models**: Collection, CollectionItem, StoredFile
- **Services**: Multi-type item management, file operations
- **Validation**: Item type rules, file size/type restrictions

### 6. Security Module
- **Middleware**: authToken, rate limiting, helmet, CORS, error handler
- **Utilities**: Crypto (AES-GCM), Bcrypt (password hashing), Error creation
- **Models**: OTP, Session tracking
- **Configuration**: Environment variables, security tokens

### 7. File Storage Module
- **Routes**: `/api/files/*`
- **Controllers**: uploadInit, uploadComplete, getFile, deleteFile
- **Services**: Provider abstraction (S3, Cloudinary, local), signed URLs
- **Models**: stored_files metadata
- **Configuration**: Allowed types, max sizes, provider settings

## Architecture Diagrams

### Complete System Diagram

```
+------------------+       HTTPS       +------------------+
|  Android APK     | ────────────────▶ |  Node.js API     |
|  (React + Cap)   |                   |  (Express)       |
|                  |                   |                  |
|  +-------------+ | 1. Auth Request   |  +-------------+ |
|  |  UI Layer   | ◀─────────────── |  |  Routes     | |
|  |  (React)    | 2. Data Validation|  |  (Auth, Card)| |
|  +-------------+ | 3. Encrypt Data   |  +-------------+ |
|                  | 4. API Call       |  +-----^-------+ |
|  +-------------+ | 5. Decrypt Data   |       |         |
|  |  Crypto Lib | ◀───────────────|       |  MongoDB  |
|  | (AES-GCM)   | 6. Media Upload   |   +---|  Atlas    |
|  +-------------+ | 7. File Ops       |   |   |           |
|                  | 8. Read Decrypt   |   +---|           |
|  +-------------+ | 9. Vault Unlock   |        |         |
|  |  Keystore   | ◀───────────────|        +---------+
|  +-------------+
|
+------------------+
|  Object Storage  |
|  (S3/Cosmos/etc) |
|  Encrypted media |
+------------------+

+------------------+
|  SMTP Email      |
|  OTP delivery    |
+------------------+
```

### Database Schema Summary

```
users
├── _id
├── email (unique, indexed)
├── emailVerified
├── status (active/pending/locked)
├── encryptionKeyVersion
├── recoveryConfiguration (recoveryKeyId, recoveryKeyVersion, recoveryKeyEncrypted - bcrypt hash)
├── createdAt, updatedAt

otp_challenges
├── _id
├── email (indexed)
├── purpose (registration/login/pin-reset)
├── otpHash (bcrypt)
├── expiresAt (TTL index - 1 hour)
├── attempts (max 5)
├── consumedAt
├── createdAt

sessions
├── _id
├── userId (indexed)
├── refreshTokenHash (bcrypt)
├── deviceMetadata
├── expiresAt
├── revokedAt
├── createdAt

cards
├── _id
├── userId (indexed)
├── title
├── encryptedPayload (AES-256-GCM)
├── encryptionVersion
├── createdAt, updatedAt

bank_details
├── _id
├── userId (indexed)
├── encryptedPayload (AES-256-GCM)
├── linkedCardIds ([ObjectId])
├── encryptionVersion
├── createdAt, updatedAt

passwords
├── _id
├── userId (indexed)
├── encryptedPayload (AES-256-GCM)
├── encryptionVersion
├── createdAt, updatedAt

collections
├── _id
├── userId (indexed)
├── title
├── description
├── createdAt, updatedAt

collection_items
├── _id
├── userId (indexed)
├── collectionId (indexed)
├── itemType (text|image|video|audio|file)
├── title
├── encryptedPayload
├── fileReferences ([String])
├── encryptionVersion
├── createdAt, updatedAt

stored_files
├── _id
├── userId (indexed)
├── collectionId
├── storageKey (unique)
├── encryptedFileMetadata
├── mimeType
├── size
├── checksum
├── createdAt
```

## API Design

### Versioned REST API Base Path
All endpoints at: `/api/v1`

### Success Response Format
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "A meaningful error message",
  "code": "ERROR_CODE"
}
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register with email, send OTP |
| POST | `/api/v1/auth/send-otp` | Send OTP to email |
| POST | `/api/v1/auth/verify-otp` | Verify 6-digit OTP |
| POST | `/api/v1/auth/complete-registration` | Create login PIN |
| POST | `/api/v1/auth/login` | Login with PIN |
| POST | `/api/v1/auth/refresh` | Refresh JWT session |
| POST | `/api/v1/auth/logout` | Clear session, clear cookie |
| POST | `/api/v1/auth/forgot-pin` | Send OTP for PIN reset |
| POST | `/api/v1/auth/reset-pin` | Reset PIN with valid OTP |

### Cards Endpoints

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/v1/cards` | ✓ |
| POST | `/api/v1/cards` | ✓ |
| GET | `/api/v1/cards/:id` | ✓ |
| PUT | `/api/v1/cards/:id` | ✓ |
| DELETE | `/api/v1/cards/:id` | ✓ |

### Bank Details Endpoints

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/v1/banks` | ✓ |
| POST | `/api/v1/banks` | ✓ |
| GET | `/api/v1/banks/:id` | ✓ |
| PUT | `/api/v1/banks/:id` | ✓ |
| DELETE | `/api/v1/banks/:id` | ✓ |
| POST | `/api/v1/banks/:id/link-card` | ✓ |
| DELETE | `/api/v1/banks/:id/link-card/:cardId` | ✓ |

### Passwords Endpoints

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/v1/passwords` | ✓ |
| POST | `/api/v1/passwords` | ✓ |
| GET | `/api/v1/passwords/:id` | ✓ |
| PUT | `/api/v1/passwords/:id` | ✓ |
| DELETE | `/api/v1/passwords/:id` | ✓ |

### Collections Endpoints

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/v1/collections` | ✓ |
| POST | `/api/v1/collections` | ✓ |
| GET | `/api/v1/collections/:id` | ✓ |
| PUT | `/api/v1/collections/:id` | ✓ |
| DELETE | `/api/v1/collections/:id` | ✓ |
| GET | `/api/v1/collections/:id/items` | ✓ |
| POST | `/api/v1/collections/:id/items` | ✓ |
| GET | `/api/v1/items/:id` | ✓ |
| PUT | `/api/v1/items/:id` | ✓ |
| DELETE | `/api/v1/items/:id` | ✓ |

### File Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/files/upload-init` | Initialize upload, get authorization |
| POST | `/api/v1/files/upload-complete` | Complete encrypted upload |
| GET | `/api/v1/files/` | List user's file metadata |
| DELETE | `/api/v1/files/:id` | Delete file metadata |

## Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| VALIDATION_ERROR | Input validation failed | 400 |
| DUPLICATE_ENTRY | Email/record already exists | 409 |
| INVALID_OTP | OTP incorrect or expired | 400 |
| MAX_ATTEMPTS_EXCEEDED | Too many failed attempts | 403 |
| AUTHENTICATION_REQUIRED | Missing/invalid token | 401 |
| AUTHORIZATION_DENIED | User not authorized for resource | 403 |
| RESOURCE_NOT_FOUND | Record does not exist | 404 |
| RATE_LIMIT_EXCEEDED | Too many requests | 429 |
| INTERNAL_SERVER_ERROR | Unexpected error | 500 |