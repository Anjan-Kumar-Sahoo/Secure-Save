# Secure Save - Database Schema

## MongoDB Atlas Collections

### users

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `email` | String | User email address | unique, indexed | required, unique |
| `emailVerified` | Boolean | Whether email verified | - | default: false |
| `status` | String | Account status: active/pending/locked | - | default: 'pending' |
| `encryptionKeyVersion` | Number | Current vault key version | - | default: 1 |
| `recoveryConfiguration` | Object | Recovery key metadata | - | required |
| &nbsp;&nbsp; `recoveryKeyId` | String | Unique recovery key identifier | - | required |
| &nbsp;&nbsp; `recoveryKeyVersion` | Number | Key version number | - | required |
| &nbsp;&nbsp; `recoveryKeyEncrypted` | String | bcrypt-hashed recovery key | - | required |
| `createdAt` | Date | Record creation timestamp | - | auto |
| `updatedAt` | Date | Last update timestamp | - | auto |

**Indexes:**
- `email` - unique index, prevents duplicate accounts
- `status` - frequent filtering by account state

**TTL Options:**
- None (data persists until account deletion)

---

### otp_challenges

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `email` | String | Associated user email | indexed | required |
| `purpose` | String | 'registration' | login' | 'pin-reset' | required, enum |
| `otpHash` | String | bcrypt-hashed 6-digit OTP | - | required |
| `expiresAt` | Date | OTP expiration time | TTL | required, expires: '1h' |
| `attempts` | Number | Failed attempt count | - | default: 0, max: 5 |
| `consumedAt` | Date | When OTP was used/consumed | - | |
| `createdAt` | Date | Creation timestamp | - | auto |

**Indexes:**
- `email + purpose` - compound index for OTP lookup
- `expiresAt` - TTL index auto-deletes expired challenges (1 hour)

**Behavior:**
- Automatic cleanup via MongoDB TTL index
- Max 5 attempts per OTP challenge
- OTP expires in 5 minutes (300 seconds) real-time
- Consumed OTPs marked with `consumedAt`

---

### sessions

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Referenced user ID | indexed | required |
| `refreshTokenHash` | String | bcrypt-hashed refresh token | - | required |
| `deviceMetadata` | Object | Browser/device info | - | |
| &nbsp;&nbsp; `userAgent` | String | HTTP user agent string | - | |
| &nbsp;&nbsp; `ipAddress` | String | Connection IP address | - | |
| &nbsp;&nbsp; `deviceId` | String | Identifier for device | - | |
| `expiresAt` | Date | Session expiration | - | required |
| `revokedAt` | Date | When session was revoked | - | |
| `createdAt` | Date | Session creation | - | auto |

**Indexes:**
- `userId` - find sessions by user
- `_id` - default primary key

**Behavior:**
- JWT access tokens + refresh token rotation
- Device fingerprinting for security
- Session revocation on logout
- Inactive session cleanup

---

### cards

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Owner user ID | indexed | required |
| `title` | String | Card title/name | - | required |
| `encryptedPayload` | String | AES-256-GCM encrypted data | - | required |
| `encryptionVersion` | String | Key version for decryption | - | required |
| `createdAt` | Date | Card creation timestamp | - | auto |
| `updatedAt` | Date | Last update timestamp | - | auto |

**Indexes:**
- `userId` - retrieve user's cards efficiently
- Combined query: `{ userId, _id }` - specific card lookup

**Security:**
- `encryptedPayload` never stored in plaintext
- `encryptionVersion` tracks key rotation
- Client-side encryption before database write

---

### bank_details

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Owner user ID | indexed | required |
| `encryptedPayload` | String | AES-256-GCM encrypted data | - | required |
| `linkedCardIds` | Array<ObjectId> | References to card _ids | indexed | default: [] |
| `encryptionVersion` | String | Key version for decryption | - | required |
| `createdAt` | Date | Bank entry creation | - | auto |
| `updatedAt` | Date | Last update timestamp | - | auto |

**Indexes:**
- `userId` - user's bank entries
- `linkedCardIds` - find banks linked to specific cards

**Relationships:**
- `linkedCardIds` references `_id` from `cards` collection
- **Delete protection**: Deleting a bank record does NOT delete linked cards
- Uses MongoDB ObjectId references, not embedded data

**Dynamic Fields:**
- `encryptedPayload` contains all custom key-value pairs
- Structure: `{ key1: encryptedValue1, key2: encryptedValue2, ... }`
- Encryption versioning for future compatibility

---

### passwords

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Owner user ID | indexed | required |
| `encryptedPayload` | String | AES-256-GCM encrypted credential data | - | required |
| `encryptionVersion` | String | Key version for decryption | - | required |
| `createdAt` | Date | Password entry creation | - | auto |
| `updatedAt` | Date | Last update timestamp | - | auto |

**Indexes:**
- `userId` - user's password entries
- Combined: `{ userId, _id }` - specific entry lookup

**Payload Structure (encrypted):**
```json
{
  "title": "encrypted",
  "username": "encrypted",
  "email": "encrypted",
  "password": "encrypted",
  "websiteUrl": "encrypted",
  "notes": "encrypted"
}
```

**Security:**
- All fields encrypted before leaving client
- No plaintext credentials in database
- Show/hide requires vault unlock

---

### collections

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Owner user ID | indexed | required |
| `title` | String | Collection title | - | required, max 50 chars |
| `description` | String | Optional description | - | max 200 chars |
| `createdAt` | Date | Creation timestamp | - | auto |
| `updatedAt` | Date | Last update timestamp | - | auto |

**Indexes:**
- `userId` - user's collections
- `_id` - default primary key

**Behavior:**
- User-defined titles (not predefined values)
- Title required, description optional
- Collections can be renamed

---

### collection_items

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Owner user ID | indexed | required |
| `collectionId` | String | Parent collection _id | indexed | required |
| `itemType` | String | 'text' | 'image' | 'video' | 'audio' | 'file' | required, enum |
| `title` | String | Item title/name | - | required |
| `encryptedPayload` | String | Encrypted item data (varies by type) | - | required |
| `fileReferences` | Array<String> | Storage keys for media files | - | default: [] |
| `encryptionVersion` | String | Key version for decryption | - | required |
| `createdAt` | Date | Item creation | - | auto |
| `updatedAt` | Date | Last update | - | auto |

**Indexes:**
- `userId + collectionId` - items within a collection
- `collectionId` - retrieve all items in collection
- `itemType` - filter by type

**Item Type Behaviors:**

| Type | Encrypted Payload | File References | Behavior |
|------|------------------|-----------------|----------|
| `text` | title + content | [] | Text note with title/content |
| `image` | storageKey | [storageKey] | Image with thumbnail |
| `video` | storageKey | [storageKey] | Video with preview |
| `audio` | duration + metadata | [storageKey] | Audio with playback |
| `file` | metadata | [storageKey] | General file attachment |

---

### stored_files

| Field | Type | Description | Index | Constraints |
|-------|------|-------------|-------|-------------|
| `_id` | ObjectId | Primary key | auto | required |
| `userId` | String | Owner user ID | indexed | required |
| `collectionId` | String | Parent collection _id | - | |
| `storageKey` | String | Unique identifier for object storage | unique | required |
| `encryptedFileMetadata` | String | Encrypted file metadata | - | required |
| `mimeType` | String | Original file MIME type | - | required |
| `size` | Number | File size in bytes | - | required |
| `checksum` | String | SHA-256 checksum | - | required |
| `createdAt` | Date | Upload timestamp | - | auto |

**Indexes:**
- `storageKey` - unique identifier, prevents duplicates
- `userId` - user's stored files
- `collectionId` - files within a collection

**Behavior:**
- Records encrypted file metadata, not the file itself
- `storageKey` maps to object storage provider
- `checksum` for data integrity verification
- `size` for storage quota management
- MIME type for client-side validation

## Encryption Boundaries

### What Gets Encrypted (Client-Side)

| Data Type | Encrypted Before | Stored As |
|-----------|-----------------|-----------|
| Card payload | ✅ Yes (AES-256-GCM) | Base64 string |
| Bank payload | ✅ Yes (AES-256-GCM) | Base64 string |
| Password payload | ✅ Yes (AES-256-GCM) | Base64 string |
| Collection item text | ✅ Yes (AES-256-GCM) | Base64 string |
| Image/Video/Audio metadata | ✅ Yes (AES-256-GCM) | Base64 string |
| File attachments | ✅ Yes (AES-256-GCM) | Base64 string |

### What Stays Plaintext (Non-Sensitive)

| Data Type | Stored As | Purpose |
|-----------|-----------|---------|
| Collection titles | Plaintext | Indexing, display |
| Item titles | Plaintext | Display, search |
| Descriptions | Plaintext | Context, display |
| User emails | Plaintext (hashed in OTP) | Authentication, communication |
| OTP hashes | bcrypt hash | Verification, security |
| Session tokens | JWT (signed) | Authentication |
| File metadata (mime, size) | Plaintext | Browsing, validation |
| Storage keys | Plaintext | Object storage mapping |
| Audit timestamps | Plaintext | Logging, debugging |

## Indexes Summary

| Collection | Index Fields | Purpose |
|------------|-------------|---------|
| `users` | `email` | Unique constraint, login |
| `users` | `status` | Account filtering |
| `otp_challenges` | `email + purpose` | OTP lookup |
| `otp_challenges` | `expiresAt` | TTL auto-cleanup |
| `sessions` | `userId` | User session retrieval |
| `cards` | `userId` | User's cards list |
| `bank_details` | `userId` | User's banks list |
| `bank_details` | `linkedCardIds` | Card-bank relationships |
| `passwords` | `userId` | User's passwords list |
| `collections` | `userId` | User's collections list |
| `collection_items` | `userId + collectionId` | Items within collection |
| `collection_items` | `collectionId` | All items in collection |
| `collection_items` | `itemType` | Type filtering |
| `stored_files` | `storageKey` | Unique constraint |
| `stored_files` | `userId` | User's files list |
| `stored_files` | `collectionId` | Collection's files |

## Data Relationships

```
users (1)────(often) cards
users (1)────(often) bank_details
users (1)────(often) passwords
users (1)────(often) collections
collections (1)────(often) collection_items
cards (1)────(often) bank_details.linkedCardIds
```

**Ownership Validation Rule:**
- Every query must include `userId` filter
- Frontend never trusts client-supplied user IDs
- Identity derived from authenticated JWT session

**No Orphaned Data:**
- Collection deletion removes associated items
- Bank deletion does NOT remove linked cards
- User deletion cascades: all their records removed

## Data Retention

| Data Type | Retention Policy | Cleanup Method |
|-----------|-----------------|----------------|
| User accounts | Indefinite | Manual deletion only |
| OTP challenges | 24 hours after consumption | TTL index (1 hour expiry) |
| Session records | 30 days inactive | Custom cleanup script |
| Card records | Indefinite | User deletion |
| Bank records | Indefinite | User deletion |
| Password entries | Indefinite | User deletion |
| Collection items | Indefinite | Collection deletion or orphan marking |
| Stored files | 90 days after item deletion | Automated cleanup job |
| Audit logs | 1 year | Rotated archival |