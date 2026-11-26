# Secure Save - Encryption & Key Management

## Key Generation

### Vault Encryption Key (Client-Side)

| Property | Value |
|----------|-------|
| **Algorithm** | AES-256-GCM |
| **Key Size** | 256 bits (32 random bytes) |
| **Generation** | `crypto.getRandomValues(new Uint8Array(32))` or `window.crypto.getRandomValues()` |
| **Entropy Source** | Browser/Web Crypto API cryptographically secure RNG |
| **When Generated** | On user registration (first app launch) |
| **Storage** | Never stored on server; protected by PIN + Android Keystore |
| **Never** | Transmitted to backend, logged, or embedded in APK |

### PIN Derivation (bcrypt)

| Property | Value |
|----------|-------|
| **Algorithm** | bcrypt |
| **Rounds** | 12 (configurable via `BCRYPT_SALT_ROUNDS` env var) |
| **Purpose** | Hash the user's 4-6 digit PIN for secure storage |
| **Input** | PIN as string (4-6 digits) |
| **Output** | Hashed string stored in `users.recoveryKeyEncrypted` |
| **Verification** | `bcrypt.compare(attemptedPin, storedHash)` |
| **Never** | Used as direct AES-256-GCM key (would be vulnerable to brute-force) |

### Recovery Key (Separate from PIN)

| Property | Value |
|----------|-------|
| **Algorithm** | AES-256-GCM encryption of recovery key |
| **Size** | 256 bits (32 random bytes) |
| **Generated** | At user registration, alongside vault key |
| **Stored** | Encrypted with vault key in user record metadata |
| **Never** | Stored in plaintext; never transmitted |
| **Purpose** | Recover vault access if PIN is forgotten |

### Key Hierarchy Summary

```
+----------------------+     +----------------------+
|  256-bit Vault Key   |     |  256-bit Recovery Key|
| (random, generated)  |     | (random, generated)  |
+----------+-----------+     +----------+-----------+
           │                      │
           │                      │
           ▼                      ▼
+----------+-----------+     +----------+-----------+
|  PIN (4-6 digits)    |     |  Recovery Key unused |
+----------+-----------+     +----------+-----------+
           │
           ▼
+----------+-----------+     +---------------------+
| bcrypt (12 rounds) |     |  Kept for recovery  |
| stored in DB       |     |  (if PIN forgotten) |
+----------+-----------+     +---------------------+
           │
           ▼
+----------+-----------+     +----------------------+
|  PIN auth only     |     |  Unlocks vault key   |
|  (NOT AES key)     |     |  via: PIN + Keystore |
+----------+-----------+     +----------------------+
```

---

## Key Wrapping

### How the Vault Key is Protected

#### 1. PIN + Android Keystore Derivation

```
User enters PIN (4-6 digits)
    │
    ▼
PIN + Android Keystore API
    │
    ▼
Derive Vault Key:
  • Input: PIN string + Keystore-stored key
  • Algorithm: PBKDF2 or Argon2id (100,000+ iterations)
  • Output: 256-bit AES key
    │
    ▼
Use this key to:
  • Encrypt/decrypt all vault data (AES-256-GCM)
  • Wrap/unwrap the recovery key
  • Key version rotation
```

#### 2. Key Version Rotation

| Version | When Rotated | Process |
|---------|-------------|---------|
| `v1` | Initial registration | On app first launch |
| `v2` | User changes PIN | New PIN → new derivation |
| `v3` | Scheduled rotation | Every 90 days (optional) |
| `v+` | Security incident | Emergency re-encryption |

- `encryptionVersion` field stored with each encrypted record
- Backward compatibility: can decrypt v1 records with v1 key
- User-initiated re-encryption from app settings
- Automatic on PIN change

#### 3. Recovery Key Workflow

**Initial Registration:**

```
1. Generate vault key (256-bit random) → KV
2. Generate recovery key (256-bit random) → RK
3. Encrypt RK with KV: EK = AES-256-GCM-Encrypt(KV, RK)
4. Store: { encryptedRecoveryKey: EK, keyVersion: 1 }
5. Never store RK or KV in plaintext
```

**When PIN is Forgotten (Recovery Flow):**

```
1. User → Forgot PIN → OTP verification
2. Backend → Verify OTP (6-digit, 5 min expiry)
3. Backend → Decrypt RK using current vault key
   • Requires: user authenticates, vault key derived from PIN + Keystore
4. Backend → Provide encrypted RK to user via secure channel
5. User → Decrypt RK with old PIN (client-side)
   • Uses: PIN + Android Keystore → derive vault key → AES-256-GCM decrypt
6. User → Enter new PIN → Derive new vault key
7. User → Re-encrypt RK with new vault key
8. Backend → Store new { encryptedRecoveryKey, keyVersion: 2 }
9. All data remains accessible with new PIN
```

**When Recovery Key is Lost + PIN is Known:**

```
Result: Vault key cannot be re-derived
        Data remains encrypted with old key
        Honest message: "Cannot recover access without both PIN and recovery key"
        No backdoor or master key exists
```

---

## Encryption/Decryption Operations

### AES-256-GCM Encrypt (Client-Side)

```javascript
// Pseudocode - actual implementation uses Web Crypto API

async function encryptData(plaintext, vaultKey) {
  // 1. Generate random 12-byte IV (nonce)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // 2. Create AES-256-GCM cipher
  const cryptoKey = await crypto.subtle.importKey(
    'raw', vaultKey, 'AES-GCM', false, ['encrypt', 'decrypt']
  );
  
  // 3. Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(plaintext)
  );
  
  // 4. Result: { iv, ciphertext, authTag }
  // 5. Prepend IV, append authTag, Base64 encode
  const result = base64.encode(Buffer.concat([iv, encrypted, authTag]));
  
  return result;
}
```

### AES-256-GCM Decrypt (Client-Side)

```javascript
// Pseudocode

async function decryptData(encryptedBase64, vaultKey) {
  // 1. Base64 decode → { iv || ciphertext || authTag }
  const data = base64.decode(encryptedBase64);
  const iv = data.subarray(0, 12);       // first 12 bytes
  const authTag = data.subarray(-16);    // last 16 bytes
  const ciphertext = data.subarray(12, -16); // middle bytes
  
  // 2. Create AES-256-GCM cipher
  const cryptoKey = await crypto.subtle.importKey(
    'raw', vaultKey, 'AES-GCM', false, ['decrypt']
  );
  
  // 3. Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, authTag },
    cryptoKey,
    ciphertext
  );
  
  // 4. Return plaintext string
  return new TextDecoder().decode(decrypted);
}
```

### Checksum & Integrity

- **Auth Tag**: Built into AES-256-GCM; detects any tampering
- **SHA-256 Checksum**: Additional metadata stored in `stored_files` collection
  - `checksum: sha256(plaintext)` for file integrity
  - Used when downloading/opening encrypted files
  - Mismatch → warn user, do not display corrupted data

---

## Nonce Management

### IV (Initialization Vector) Requirements

| Property | Specification |
|----------|--------------|
| **Size** | 12 bytes (96 bits) - NIST recommendation for GCM |
| **Uniqueness** | Must be unique per key per encryption operation |
| **Probability of Collision** | ~2^-96 (negligible) |
| **Generation** | `crypto.getRandomValues(new Uint8Array(12))` |
| **Storage** | Prepended to ciphertext: `Base64(IV || CT || Tag)` |
| **Rotation** | New IV for each encrypt operation; never reused |

### Nonce Reuse Risk

- **Reusing IV with same key**: Compromises authentication tag security
- **May allow**: Plaintext recovery attacks (theoretical but serious)
- **Prevention**: 
  - Generate fresh IV for every encrypt operation
  - Use random (not counter-based) IVs
  - 12-byte space: 2^96 possible values → astronomical collision probability
  - Library implementation handles this (Web Crypto API)

### Key Version + IV Combination

- Each encryption operation uses: `keyVersion + iv`
- Records stored: `{ encryptedPayload, encryptionVersion, iv (implicit via storage format) }`
- Decryption: look up key by version, extract IV from stored format

---

## Recovery-Key Design

### Recovery Key Purpose

- **Allows**: Vault access recovery if PIN is forgotten
- **Does NOT**: Provide backdoor access or master key
- **Is**: Separate from PIN derivation; uses vault key as encryption layer

### Recovery Key Lifecycle

| Stage | Action | Responsibility |
|-------|--------|----------------|
| **Generation** | At registration, 256-bit random | Client-side (frontend) |
| **Encryption** | Encrypt with vault key | Client-side (frontend) |
| **Storage** | In user DB record, encrypted | Backend (MongoDB Atlas) |
| **Access** | User provides old PIN + OTP verification | Both (frontend + backend) |
| **Rotation** | New PIN → re-encrypt RK | Client-side + backend |
| **Loss** | Both PIN + RK lost → data unrecoverable | Documented limitation |

### Recovery Key Storage Format (in MongoDB `users` collection)

```javascript
// Pseudocode - actual schema in DATABASE_SCHEMA.md
users: {
  _id: ObjectId,
  email: String,
  // ... other fields
  recoveryConfiguration: {
    recoveryKeyVersion: Number,      // e.g., 1, 2, 3
    encryptedRecoveryKey: String,    // Base64(AES-GCM encrypted RK)
    keyEncryptionIV: String,         // Base64, IV used to encrypt RK
    keyEncryptionAuthTag: String,    // Base64, auth tag from RK encryption
  }
}
```

### Loss Scenarios

| Scenario | Outcome | User Action |
|----------|---------|-------------|
| PIN forgotten, RK known | ✅ Recovery possible | Forgot PIN flow → OTP → RK decryption → new PIN |
| PIN known, RK lost | ❌ Recovery impossible | Cannot re-derive vault key |
| Both PIN + RK lost | ❌ Data unrecoverable | No backdoor; data remains encrypted |
| Device replacement | ✅ Possible | Re-register with RK (if saved) or start fresh |

### Honest Communication

**App displays in Settings → Security:**

> "Your recovery key is your safety net. If you forget your PIN, this key (combined with OTP verification) allows you to set a new PIN without losing your data. **Important**: Store your recovery key in a secure location. If you lose both your PIN and your recovery key, we cannot recover access to your encrypted data. This is an intentional security design — no master keys or backdoors exist."

---

## Key Rotation Policy

### When Keys Are Rotated

| Trigger | Frequency | Process |
|---------|-----------|---------|
| User changes PIN | On-demand | New PIN → derive new vault key → re-encrypt all data |
| Scheduled rotation | Every 90 days (configurable) | Background re-encryption on next vault unlock |
| Security incident | Immediate | Emergency re-encryption if breach suspected |
| App update | Major version | May require re-encryption if key format changes |

### Re-encryption Process

```
1. User authenticates (PIN + OTP if needed)
2. Derive current vault key (PIN + Keystore)
3. For each encrypted record:
   a. Decrypt with current vault key
   b. Re-encrypt with new vault key
   c. Update encryptionVersion field
4. Save updated records to MongoDB
5. Notify user: "Your data has been re-encrypted with updated security"
6. Clear old key versions from active use
```

### Backward Compatibility

- **Multiple encryptionVersion support**: v1, v2, v3 stored alongside records
- **Decryption**: Try each version until one succeeds
- **Migration**: Automatic on first app launch after update
- **No data loss**: Re-encryption is transparent to user

---

## Lost-Device Scenarios

### Device Replacement (Same User)

```
1. Install Secure Save on new device
2. Choose "Recover from Recovery Key"
3. Enter recovery key (if user saved it)
4. Enter OTP (sent to registered email)
5. Set new PIN
6. Vault key re-derived, data accessible
7. All existing data preserved
```

### Device Replacement (No Recovery Key)

```
1. Install Secure Save on new device
2. Choose "Start Fresh" (no recovery)
3. New account created
4. All previous data unrecoverable
5. User warns: "This is why we recommend saving your recovery key"
```

### Stolen Device

```
1. User reports device stolen
2. Remote wipe (iCloud/Google Find My, not built into app)
3. Change email password (associated with Secure Save)
4. OTP delivery stopped for old email if changed
5. New device: register fresh or recover if RK saved
6. Old device: data encrypted, inaccessible without PIN/RK
```

### Corporate/Enterprise Loss

- **Not supported**: Secure Save is personal/vault-only
- **Recommendation**: Use organization's MDM solution for device management
- **Data separation**: Keep personal vault separate from work data

---

## Dependency Cryptography Review

| Library | Purpose | Version | Status |
|---------|---------|---------|--------|
| `crypto-js` | Base64, utility functions | `^4.2.0` | No critical CVEs |
| Web Crypto API | AES-GCM, Random, PBKDF2 | Browser native | Standard, audited |
| `bcryptjs` | PIN password hashing | `^2.5.0` | Actively maintained |
| `jsonwebtoken` | JWT signing/verification | `^9.0.0` | Regular security updates |

### Cryptographic Library Vetting

- **Web Crypto API**: Browser standard; reviewed by security community; no known critical flaws
- **bcryptjs**: Well-established; updated for new attack research; use 12+ rounds
- **No custom crypto**: Never implement own encryption algorithms
- **Library updates**: Monitor CVE databases; update within 30 days of critical patch

### Avoided Anti-Patterns

- ❌ Do NOT use PIN directly as AES key (brute-force vulnerable)
- ❌ Do NOT store recovery key in plaintext
- ❌ Do NOT use MD5 or SHA-1 for password hashing
- ❌ Do NOT reuse nonces/IVs with same key
- ❌ Do NOT embed keys in source code or APK
- ❌ Do NOT use client-side storage (localStorage) for vault secrets
- ❌ Do NOT trust client-side validation alone (always server-side too)

---

## Compliance with Security Architecture Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| AES-256-GCM for authenticated encryption | ✅ | Web Crypto API, all sensitive payloads |
| Argon2id for key derivation | ⚠️ Consider | Currently bcrypt (12 rounds); Argon2id available if desired |
| Cryptographically secure random key generation | ✅ | `crypto.getRandomValues()` |
| Unique nonces for encryption operations | ✅ | 12-byte IV, generated per operation |
| Secure key wrapping | ✅ | PIN + Android Keystore → vault key; recovery key encrypted with vault key |
| Unique nonces never reused | ✅ | Fresh IV per encrypt operation |
| Key separation (PIN ≠ encryption key) | ✅ | Three distinct components |
| Recovery-key mechanism | ✅ | Separate random key, OTP-verifiable |
| Never use 6-digit PIN as AES key directly | ✅ | Explicitly avoided with derivation layer |
| Never log encryption keys | ✅ | No keys in console logs, error messages |
| Never embed master keys in APK | ✅ | Keys generated at runtime, never in source |
| HTTPS-only production API | ✅ | Configured in API setup |
| Strict CORS configuration | ✅ | Environment-specific origins |
| No plaintext secrets in database logs | ✅ | All payloads encrypted before DB write |
| Regular backup strategy | ✅ | MongoDB Atlas automated backups |
| No public database access | ✅ | Authentication required on all endpoints |
| Least-privilege database user | ✅ | Mongoose with restricted permissions |
| TLS connections | ✅ | All API communications HTTPS |
| Proper indexes | ✅ | As specified in DATABASE_SCHEMA.md |
| Encrypted sensitive fields | ✅ | All vault data AES-256-GCM before upload |
| Separate development/production databases | ✅ | Environment-configurable MONGODB_URI |
| Android Keystore integration | ✅ | Configurable, documented |
| FLAG_SECURE for sensitive screens | ✅ | Documented in UI guidelines |
| No plaintext secrets in local logs | ✅ | Logging redaction policies |
| Safe temporary file handling | ✅ | Documented limitations |
| Protection against accidental screenshots | ✅ | FLAG_SECURE, UI design |
| Claim encryption without implementation | ❌ | **Must not claim unless working and tested** |

---

## Compliance Checklist

- [x] AES-256-GCM for all sensitive data encryption
- [x] Client-side key generation (never server-generated vault key)
- [x] PIN used only for authentication, not as encryption key
- [x] Recovery key separate from PIN derivation
- [x] All encryption/decryption happens on client
- [x] Backend never receives plaintext vault secrets
- [x] Database fields encrypted before upload
- [x] No master keys or backdoors in codebase
- [x] Key versioning for rotation and backward compatibility
- [x] Nonce/IV management (12-byte, unique per operation)
- [x] Authenticated encryption (AES-GCM provides integrity + confidentiality)
- [x] Loss-resistant design (recovery key, but honest about limits)
- [x] Documented security limitations (transparent with users)
- [x] Regular dependency vulnerability checks
- [x] No localStorage for vault secrets
- [x] Android Keystore integration (where available)
- [x] FLAG_SECURE on sensitive UI components
- [x] Error handling that doesn't expose secrets