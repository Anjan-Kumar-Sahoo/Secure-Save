# Secure Save - API Documentation & Specifications

All API responses follow the standard JSON envelope defined in `@secure-save/shared-types`:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}
```

---

## Base URLs

- **Production API:** `https://secure-save-blue.vercel.app/api`
- **Development API:** `http://localhost:3000/api`

---

## Authentication Endpoints (`/api/auth`)

### 1. Account Lookup
- **Route:** `POST /api/auth/session/lookup`
- **Purpose:** Verifies whether an email address already has a registered vault.
- **Request Body:**
  ```json
  { "email": "user@example.com" }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Account status retrieved",
    "data": {
      "exists": true,
      "isRegistered": true,
      "emailVerified": true
    }
  }
  ```

### 2. Request OTP
- **Route:** `POST /api/auth/otp/send`
- **Purpose:** Dispatches a 6-digit numeric OTP via email. Rate-limited to enforce a 60-second resend cooldown.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "type": "registration" // or "pin_reset"
  }
  ```

### 3. Verify OTP
- **Route:** `POST /api/auth/otp/verify`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "type": "registration"
  }
  ```

### 4. Setup PIN
- **Route:** `POST /api/auth/pin/setup`
- **Purpose:** Completes initial user registration by setting a 6-digit PIN.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "pin": "123456"
  }
  ```

### 5. Login with PIN
- **Route:** `POST /api/auth/session/login`
- **Purpose:** Authenticates user and returns a signed session JWT.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "pin": "123456"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "67...", "email": "user@example.com" },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

---

## Vault Endpoints (Protected by `Authorization: Bearer <token>`)

### Passwords (`/api/passwords`)
- `GET /api/passwords` - List all encrypted password records.
- `POST /api/passwords` - Create encrypted password item `{ encryptedPayload, encryptionVersion }`.
- `PUT /api/passwords/:id` - Update encrypted password item.
- `DELETE /api/passwords/:id` - Delete password item.

### Payment Cards (`/api/cards`)
- `GET /api/cards` - List all encrypted credit/debit card records.
- `POST /api/cards` - Create card item `{ title, encryptedPayload, encryptionVersion }`.
- `PUT /api/cards/:id` - Update card item.
- `DELETE /api/cards/:id` - Delete card item.

### Bank Accounts (`/api/banks`)
- `GET /api/banks` - List all encrypted bank records.
- `POST /api/banks` - Create bank item `{ encryptedPayload, linkedCardIds, encryptionVersion }`.
- `PUT /api/banks/:id` - Update bank item.
- `DELETE /api/banks/:id` - Delete bank item.

### Collections & Items (`/api/collections`)
- `GET /api/collections` - List all user collections.
- `POST /api/collections` - Create collection `{ title, description }`.
- `GET /api/collections/:id/items` - List encrypted items in a collection.
- `POST /api/collections/:id/items` - Create encrypted item `{ title, itemType, encryptedPayload }`.
- `DELETE /api/collections/:id/items/:itemId` - Delete item from collection.
- `DELETE /api/collections/:id` - Delete collection and all nested items.
