# Secure Save - API Documentation

## Versioned REST API

**Base Path:** `/api/v1`

All endpoints are versioned and follow consistent response formats.

---

## Success Response Format

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

## Error Response Format

```json
{
  "success": false,
  "message": "A meaningful error message",
  "code": "ERROR_CODE"
}
```

## Authentication Requirements

Most endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header, or via secure HttpOnly cookie `__Secure-sid`. The `auth` endpoints are exempt (public).

**Auth Header Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cookie Example:**
```
__Secure-sid= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Authentication Endpoints

### POST /api/v1/auth/register

**Description:** Register new account with email OTP verification

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**
- `200`: OTP sent successfully
  ```json
  {
    "success": true,
    "message": "OTP sent to email"
  }
  ```
- `409`: Email already registered
  ```json
  {
    "success": false,
    "message": "Email already registered",
    "code": "DUPLICATE_ENTRY"
  }
  ```

---

### POST /api/v1/auth/send-otp

**Description:** Send OTP to registered email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**
- `200`: OTP sent
- `429`: Rate limited (try again in 60 seconds)

---

### POST /api/v1/auth/verify-otp

**Description:** Verify 6-digit OTP

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Responses:**
- `200`: Verified successfully, user can create PIN
- `400`: Invalid or expired OTP
  ```json
  {
    "success": false,
    "message": "Invalid OTP",
    "code": "INVALID_OTP"
  }
  ```

---

### POST /api/v1/auth/complete-registration

**Description:** Create login PIN and initialize vault

**Request:**
```json
{
  "email": "user@example.com",
  "pin": "123456",
  "confirmPin": "123456"
}
```

**Responses:**
- `200`: Registration complete
- `400`: PIN mismatch or user not verified

---

### POST /api/v1/auth/login

**Description:** Login with PIN

**Request:**
```json
{
  "email": "user@example.com",
  "pin": "123456"
}
```

**Responses:**
- `200`: Login successful, JWT issued
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "jwt-token-string"
    }
  }
  ```
- `401`: Invalid credentials
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

---

### POST /api/v1/auth/refresh

**Description:** Refresh JWT session

**Responses:**
- `200`: New JWT issued
- `401`: Invalid or expired refresh token

---

### POST /api/v1/auth/logout

**Description:** Clear session and logout

**Responses:**
- `200`: Logout successful
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```
- Clears `__Secure-sid` cookie

---

### POST /api/v1/auth/forgot-pin

**Description:** Send OTP for PIN recovery

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**
- `200`: OTP sent if email exists
- `404`: Email not found (no info leaked)

---

### POST /api/v1/auth/reset-pin

**Description:** Reset login PIN with valid OTP

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPin": "123456",
  "confirmPin": "123456"
}
```

**Responses:**
- `200`: PIN reset successful
- `400`: OTP invalid, expired, or PINs don't match

---

## Cards Endpoints

### GET /api/v1/cards

**Description:** List all user's cards

**Auth:** Required

**Responses:**
- `200`: List of cards
  ```json
  {
    "success": true,
    "message": "Cards retrieved successfully",
    "data": {
      "cards": [
        {
          "id": "card_123",
          "title": "Chase Freedom",
          "maskedNumber": "•••• •••• •••• 1234",
          "cardholderName": "John Doe",
          "expiryDate": "12/2027",
          "cardNetwork": "visa",
          "createdAt": "2026-01-15T10:30:00Z"
        }
      ]
    }
  }
  ```

---

### POST /api/v1/cards

**Description:** Create new card entry

**Auth:** Required

**Request:**
```json
{
  "title": "Chase Freedom",
  "cardholderName": "John Doe",
  "cardNumber": "4111111111111111",
  "expiryDate": "12/2027",
  "cvv": "123",
  "cardNetwork": "visa",
  "cardType": "credit"
}
```

**Responses:**
- `201`: Card created
- `400`: Validation errors

---

### GET /api/v1/cards/:id

**Description:** Get specific card details

**Auth:** Required

**Responses:**
- `200`: Card details (initially masked)
- `404`: Card not found or not user's

---

### PUT /api/v1/cards/:id

**Description:** Edit card information

**Auth:** Required

**Request:** Same fields as POST /cards

**Responses:**
- `200`: Card updated
- `404`: Card not found

---

### DELETE /api/v1/cards/:id

**Description:** Delete card

**Auth:** Required

**Responses:**
- `200`: Card deleted
- `404`: Card not found

---

## Bank Details Endpoints

### GET /api/v1/banks

**Description:** List all user's bank entries

**Auth:** Required

**Responses:**
- `200`: Bank entries list

---

### POST /api/v1/banks

**Description:** Create new bank entry

**Auth:** Required

**Request:**
```json
{
  "title": "Chase Checking",
  "accountType": "Checking",
  "accountHolderName": "John Doe",
  "accountNumber": "123456789",
  "customFields": {
    "Branch Name": "Sambalpur",
    "IFSC Code": "XXXXXX",
    "Customer ID": "XXXXX"
  }
}
```

**Responses:**
- `201`: Bank created
- `400`: Validation errors

---

### GET /api/v1/banks/:id

**Description:** Get specific bank detail

**Auth:** Required

**Responses:**
- `200`: Bank details with linked cards
- `404`: Bank not found

---

### PUT /api/v1/banks/:id

**Description:** Update bank entry

**Auth:** Required

---

### DELETE /api/v1/banks/:id

**Description:** Delete bank entry

**Auth:** Required

**Important:** Does NOT delete linked cards.

---

### POST /api/v1/banks/:id/link-card

**Description:** Link card to bank entry

**Auth:** Required

**Request:**
```json
{
  "cardId": "card_123"
}
```

**Responses:**
- `200`: Card linked
- `404`: Bank or card not found

---

### DELETE /api/v1/banks/:id/link-card/:cardId

**Description:** Unlink card from bank

**Auth:** Required

**Responses:**
- `200`: Card unlinked
- `404`: Bank or card not found

---

## Passwords Endpoints

### GET /api/v1/passwords

**Description:** List all user's password entries

**Auth:** Required

---

### POST /api/v1/passwords

**Description:** Create new password entry

**Auth:** Required

**Request:**
```json
{
  "title": "Gmail",
  "username": "john.doe@gmail.com",
  "email": "john.doe@gmail.com",
  "websiteUrl": "https://gmail.com",
  "password": "MySecurePassword123",
  "notes": "Work account, change every 90 days"
}
```

**Responses:**
- `201`: Password created
- `400`: Validation (min 8 chars, etc.)

---

### GET /api/v1/passwords/:id

**Description:** Get specific password entry

**Auth:** Required

**Behavior:**
- Initially displays masked password
- Require reveal action to view
- Recent auth check for highly sensitive fields

---

### PUT /api/v1/passwords/:id

**Description:** Update password entry

**Auth:** Required

---

### DELETE /api/v1/passwords/:id

**Description:** Delete password entry

**Auth:** Required

---

## Collections Endpoints

### GET /api/v1/collections

**Description:** List user's collections

**Auth:** Required

---

### POST /api/v1/collections

**Description:** Create new collection

**Auth:** Required

**Request:**
```json
{
  "title": "Personal Documents",
  "description": "Important papers and files"
}
```

**Responses:**
- `201`: Collection created

---

### GET /api/v1/collections/:id

**Description:** Get specific collection

**Auth:** Required

**Responses:**
- `200`: Collection detail with items

---

### PUT /api/v1/collections/:id

**Description:** Rename collection

**Auth:** Required

---

### DELETE /api/v1/collections/:id

**Description:** Delete collection

**Auth:** Required

**Behavior:** Also deletes associated collection items (no orphaned files).

---

### GET /api/v1/collections/:id/items

**Description:** List items in collection

**Auth:** Required

---

### POST /api/v1/collections/:id/items

**Description:** Add item to collection

**Auth:** Required

**Request (itemType: text):**
```json
{
  "itemType": "text",
  "title": "Meeting Notes",
  "encryptedPayload": {
    "title": "Encrypted title",
    "content": "Encrypted content"
  }
```

**Responses for other types:** Vary by itemType (image, video, audio, file)

---

### GET /api/v1/items/:id

**Description:** Get specific collection item

**Auth:** Required

**Behavior:**
- View/edit/rename/delete operations
- Require vault unlock for sensitive content

---

### PUT /api/v1/items/:id

**Description:** Update collection item

**Auth:** Required

---

### DELETE /api/v1/items/:id

**Description:** Delete collection item

**Auth:** Required

---

## File Management Endpoints

### POST /api/v1/files/upload-init

**Description:** Initialize file upload

**Auth:** Required

**Request:**
```json
{
  "mimeType": "image/jpeg",
  "size": 1024000,
  "fileName": "photo.jpg"
}
```

**Responses:**
- `200`: Upload authorization
  ```json
  {
    "success": true,
    "data": {
      "uploadId": "unique-upload-id",
      "signedUrl": "https://storage.example.com/...",
      "expiresAt": "2026-01-15T12:00:00Z"
    }
  }
  ```

---

### POST /api/v1/files/upload-complete

**Description:** Complete encrypted file upload

**Auth:** Required

**Request:**
```json
{
  "uploadId": "unique-upload-id",
  "storageKey": "user/collection/photo.jpg",
  "checksum": "sha256-hash-here",
  "encryptedMetadata": "base64-encrypted-metadata"
}
```

**Responses:**
- `200`: File metadata recorded
- `400`: Upload validation failed

---

### GET /api/v1/files/

**Description:** List user's file metadata

**Auth:** Required

---

### DELETE /api/v1/files/:id

**Description:** Delete file metadata

**Auth:** Required

**Behavior:** Also cleans up object storage after referenced items deleted.

---

## Error Codes Reference

| Code | Meaning | HTTP Status | When Triggered |
|------|---------|-------------|----------------|
| `VALIDATION_ERROR` | Input validation failed | 400 | Missing fields, bad format, range errors |
| `DUPLICATE_ENTRY` | Email/record already exists | 409 | Register with existing email, duplicate card |
| `INVALID_OTP` | OTP incorrect or expired | 400 | Wrong OTP entered, expired challenge |
| `MAX_ATTEMPTS_EXCEEDED` | Too many failed attempts | 403 | 5 failed OTP attempts, brute-force detection |
| `AUTHENTICATION_REQUIRED` | Missing/invalid auth token | 401 | No token, expired session, wrong user |
| `AUTHORIZATION_DENIED` | User not authorized for resource | 403 | Trying another user's data, cross-user access |
| `RESOURCE_NOT_FOUND` | Record does not exist | 404 | Card/bank/password/collection ID not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 | Exceeded per-minute/request limits |
| `ENCRYPTION_ERROR` | Cryptographic operation failed | 500 | Key unavailable, corrupted data |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 | Bug, external service failure |

## Rate Limiting

- **General API**: 100 requests per 60 seconds per IP
- **Auth endpoints**: 10 requests per 60 seconds per IP/email
- **OTP generation**: 5 attempts per 30 minutes per account
- **PIN login**: 5 attempts per 30 minutes per account
- **Responses**: `429 Too Many Requests` with `Retry-After` header

## CORS Configuration

**Development:**
- Allow: `http://localhost:5173`, `http://localhost:3000`
- Credentials: true

**Production:**
- Allow: `https://secure-save.app`
- Credentials: true
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

## API Versioning

- Current: `v1`
- Future: `v2` will introduce breaking changes with deprecation period
- Deprecated endpoints documented for 6 months before removal
- Version specified in all response headers: `Api-Version: v1`

---

## OpenAPI/Swagger Documentation

All endpoints documented with OpenAPI 3.0 schema available at:
```
/api/v1/api-docs
```

Generated documentation includes:
- Complete endpoint list
- Request/response schemas
- Authentication requirements
- Error code dictionary
- Example cURL requests