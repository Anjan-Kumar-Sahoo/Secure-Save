# Secure Save - Security Architecture

## Threat Model

### Attack Vectors & Mitigations

| Threat Vector | Likelihood | Impact | Mitigation |
|--------------|-----------|--------|------------|
| **OTP Interception** | Medium | High | OTP never sent as plaintext; hashed with bcrypt; 5-attempt limit; 60s cooldown |
| **PIN Brute-Force** | Medium | High | Progressive delays (5s → 30s → 2min → lockout); max 5 attempts; account lockout |
| **Session Hijacking** | Low | High | HttpOnly Secure cookies; SameSite=Strict; JWT with short expiry; IP binding |
| **Database Leak** | Medium | Critical | Client-side encryption (AES-256-GCM); no plaintext secrets ever stored |
| **Man-in-the-Middle** | Low | Critical | HTTPS-only production; TLS 1.3+; Certificate pinning consideration |
| **Cross-User Data Exposure** | Low | Critical | Ownership validation on every resource query; userId from JWT, not client |
| **XSS Attacks** | Medium | Medium | HttpOnly cookies; Content Security Policy; DOM sanitization; Dependencies vetted |
| **Rooted/Jailbroken Device** | High | Critical (local) | Cannot fully secure compromised devices; documented limitation; Keystore protection where available |
| **Physical Device Access** | Medium | Critical | FLAG_SECURE for sensitive screens; clipboard clearing; no plaintext in logs |
| **Dependency Vulnerabilities** | Medium | Medium | Regular npm audit; pin versions; update within 7 days of CVE publication |

### Data Classification

| Category | Example Data | Encryption Status | Storage Location |
|----------|-------------|-------------------|------------------|
| **Highly Sensitive** | Card numbers, CVV, PIN hashes, Passwords | ✅ AES-256-GCM client-side | MongoDB Atlas (encrypted) |
| **Medium Sensitivity** | Account numbers, Names, Email addresses | ⚠️ Partial (names in plaintext for UI) | MongoDB Atlas |
| **Low Sensitivity** | Collection titles, Item titles, Descriptions | ✅ Plaintext (non-sensitive) | MongoDB Atlas |
| **Transient** | OTP codes, Session tokens | ⏰ Temporary (OTP: 5 min; Sessions: JWT) | Memory + encrypted cookie |

---

## Encryption Strategy

### Client-Side Encryption Flow

```
User Input
    │
    ▼
Validate Input (frontend)
    │
    ▼
Generate Random IV (12 bytes) ← Unique per encryption operation
    │
    ▼
Derive Key (client-side only)
    │
    ▼
AES-256-GCM Encrypt
    │
    ▼
{ IV || Ciphertext || AuthTag } → Base64 encode
    │
    ▼
Transmit to Backend
    │
    ▼
Store in MongoDB as base64 string
    │
    ▼
User authenticates (PIN + Keystore)
    │
    ▼
Derive Same Key (PIN + Android Keystore)
    │
    ▼
AES-256-GCM Decrypt
    │
    ▼
Cleartext UI Display
```

### Key Derivation Design

```
PIN (4-6 digits)
    │
    ├──► Stored as bcrypt hash (12 rounds) in users.recoveryKeyEncrypted
    │
    └──► Never used directly as AES key (would be vulnerable to brute-force)

Vault Key (256-bit random)
    │
    ├──► Generated client-side on first registration
    │   - Uses Crypto.getRandomValues() or Web Crypto API
    │   - Never transmitted to any server
    │
    └──► Protected by PIN + Android Keystore
         │
         ├──► Derivation: PIN + Keystore → Vault Key
         │
         └──► Verification: PIN entry confirms Keystore access
```

### Separation of Concerns

| Component | Responsibility | Not Responsible |
|-----------|---------------|-----------------|
| **PIN (4-6 digits)** | User authentication only | Direct AES encryption key |
| **Vault Encryption Key** | 256-bit random key for data AES-GCM | Derived from PIN |
| **Android Keystore** | Hardware-backed key storage | PIN validation |
| **Recovery Key** | Separate mechanism for PIN recovery | Same as Vault Key |
| **bcrypt (12 rounds)** | PIN hash storage | Fast hashing (use Argon2id if available) |

### Nonce Management

- **IV (Initialization Vector)**: 12 bytes, unique per encryption operation
- **Source**: `crypto.getRandomValues(new Uint8Array(12))` or Web Crypto `window.crypto.getRandomValues()`
- **Uniqueness**: Probability of collision: ~2^-96 (negligible)
- **Storage**: Prepended to ciphertext: `Base64(IV || Ciphertext || AuthTag)`
- **Rotation**: New IV for each encrypt operation; key versioning for rotation

### Authenticated Encryption (AES-256-GCM)

- **Algorithm**: AES in Galois/Counter Mode (GCM)
- **Key Size**: 256 bits (32 bytes)
- **Tag Length**: 16 bytes (authentication tag)
- **IV Length**: 12 bytes (NIST recommended)
- **Benefits**:
  - Confidentiality + Integrity in single operation
  - Auth tag detects any tampering
  - No separate MAC needed
  - Standardized, widely analyzed

### Encryption Key Versioning

| Version | Purpose | When Rotated |
|---------|---------|--------------|
| `v1` | Initial key | On user registration |
| `v2` | Key rotation | User-initiated or after X months |
| `v3+` | Future compatibility | Planned feature |

- `encryptionVersion` field stored with each encrypted record
- Backward decryption supported for previous versions
- User-triggered re-encryption when changing PIN

---

## Key Management

### Separation of Four Key Types

```
1. Account Authentication    ──► Email + OTP verification
2. Application Login PIN     ──► Vault unlock (user remembers)
3. Vault Encryption Key      ──► AES-256-GCM data encryption
4. Recovery Mechanism        ──► PIN loss recovery (separate)
```

### Detailed Breakdown

#### 1. Account Authentication
- **Purpose**: Verify user identity during registration/login
- **Mechanism**: Email OTP (6 digits, 5 min expiry)
- **Storage**: `otp_challenges` collection (hashed, TTL)
- **Separation**: Completely separate from vault key hierarchy

#### 2. Application Login PIN
- **Purpose**: User authentication to unlock vault
- **Length**: 4-6 digits (chosen during registration)
- **Storage**: bcrypt hash (12 rounds) in `users.recoveryKeyEncrypted`
- **Never**: Sent to backend as plaintext; compared via bcrypt.compare()
- **Derivation**: Does NOT directly derive vault encryption key

#### 3. Vault Encryption Key
- **Purpose**: AES-256-GCM key for all sensitive data
- **Generation**: Client-side random (256-bit) on registration
- **Entropy**: Cryptographically secure random number generator
- **Protection**: 
  - Wrapped with PIN + Android Keystore
  - Key versioning for rotation
  - Never leaves device in plaintext
- **Data Encryption**: All card payloads, bank payloads, password payloads, collection items

#### 4. Recovery Mechanism
- **Purpose**: Recover vault access if PIN is forgotten
- **Generation**: Separate random key generated at registration
- **Storage**: Encrypted with user's vault key; metadata in user record
- **Process**: 
  - If PIN forgotten → OTP verification → Recovery key used to re-derive vault key → New PIN set
  - If recovery key also lost → Data unrecoverable (documented limitation)
- **Separation**: Completely independent from PIN derivation

### Key Hierarchy Diagram

```
                    +----------------------+
                    |  User Remembers:     |
                    |  4-6 digit PIN       |
                    +----------+-----------+
                               │
                               ▼
                    +----------------------+
                    |  bcrypt (12 rounds)  |
                    |  → stored in DB      |
                    +----------+-----------+
                               │
                               ▼
                    +----------------------+
                    |  Vault Derivation:   |
                    |  PIN + Android Keystore |
                    +----------+-----------+
                               │
                               ▼
                    +----------------------+
                    |  Vault Encryption Key|  (256-bit random)
                    |  (never leaves device|
                    |   in plaintext)      |
                    +----------+-----------+
                               │
                               ▼
                    +----------------------+
                    |  All Data Encrypted: |
                    |  AES-256-GCM         |
                    +----------------------+
                               │
                               ▼
                    +----------------------+
                    |  Forgot PIN Flow:    |
                    |  Recovery Key →      |
                    |  Re-derive Vault Key |
                    +----------------------+
                               │
                               ▼
                    +----------------------+
                    |  New PIN → New Derivation |
                    +----------------------+
```

### Android Keystore Integration

| Feature | Implementation |
|---------|---------------|
| **Key Generation** | `KeyGenParameterSpec.Builder` with `ENCRYPT_DECRYPT` purposes |
| **User Verification** | `BiometricManager` or `Secure Enclave` equivalent |
| **Algorithm** | AES-256-GCM key generation |
| **Extraction Prevention** | `setDerivationAllowExternalStorage(false)` |
| **Annual Rotation** | Optional user-initiated key rotation |
| **Backup** | Device backup may or may not include Keystore entries |

### Recovery Key Design

#### Recovery Key Generation (at Registration)

```
1. Generate 256-bit random recovery key
   │
   ▼
2. Encrypt with Vault Key
   │
   ▼
3. Store encrypted recovery key in user record
   │
   ▼
4. Metadata only (no raw key ever stored)
```

#### Recovery Key Workflow

**When PIN is Forgotten:**

```
User → Forgot PIN → Enter email
    │
    ▼
Backend → Verify OTP (6-digit, 5 min expiry)
    │
    ▼
Backend → Decrypt recovery key using vault key
    │
    ▼
Backend → Provide encrypted recovery key to user
    │
    ▼
User → (via secure channel) → Decrypt with old PIN
    │
    ▼
New PIN → Derive new vault key
    │
    ▼
Re-encrypt recovery key with new vault key
    │
    ▼
Store new metadata
```

**When Recovery Key is Lost + PIN is Known:**

```
Result: Vault key cannot be re-derived
        Data remains encrypted, unrecoverable
        Honest notification displayed to user
```

### Never Embed Master Keys in APK

- **Absolute prohibition**: No encryption keys in source code
- **No hardcoded secrets**: Environment variables only
- **Runtime generation**: Keys generated on first app launch
- **ProGuard/R8**: Obfuscation does not hide crypto keys (should not be there anyway)
- **Audit**: Regular code review for any secret exposure

### Dependency Vulnerability Checks

| Tool | Frequency | Purpose |
|------|-----------|---------|
| `npm audit` | On every `install` | Detect known vulnerabilities |
| `npm audit --production` | CI/CD pipeline | Production dependency safety |
| `dependencies.local` | Weekly | Custom vulnerability database |
| `Snyk` (if available) | On PR merge | Third-party security scanning |
| Manual review | On major version bump | Critical dependency vetting |

**Current Dependencies Status:**

| Dependency | Version | Vulnerability Status |
|------------|---------|----------------------|
| `crypto-js` | `^4.2.0` | No critical CVEs |
| `bcryptjs` | `^2.5.0` | Regularly updated |
| `jsonwebtoken` | `^9.0.0` | Monitored |
| `mongoose` | `^8.9.0` | Regular security patches |
| `express` | `^4.19.2` | Actively maintained |

---

## API Security

### Authentication Middleware

```javascript
// Every resource endpoint must validate ownership
async function resourceHandler(req, res, next) {
  // 1. Extract auth token (cookie or header)
  const token = req.cookies.__Secure-sid || 
                req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  // 2. Verify JWT
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  // 3. Extract userId from token (NOT from request body/params)
  const userId = decoded.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Token missing user identity',
      code: 'INVALID_TOKEN'
    });
  }
  
  // 4. Query resource WITH userId filter (NEVER trust client-supplied ID)
  const resource = await Model.findOne({
    _id: req.params.id,  // or req.body.id, etc.
    userId: userId       // ← Critical security measure
  });
  
  if (!resource) {
    return res.status(403).json({
      success: false,
      message: 'Authorization denied - resource not found or not yours',
      code: 'AUTHORIZATION_DENIED'
    });
  }
  
  // 5. Attach user context for audit logging
  req.userId = userId;
  req.resource = resource;
  
  next();
}
```

### CORS Configuration

```javascript
// Development
cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
});

// Production
cors({
  origin: ['https://secure-save.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Stricter limits on auth
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10 // 10 auth requests per minute
});

app.use('/api/auth/', authLimiter);
```

### NoSQL Injection Protection

- **Mongoose schemas** with strict typing
- **Parameterized queries** where possible
- **Input validation** via Zod/express-validator before DB queries
- **No string concatenation** in MongoDB queries
- **ObjectId validation** before database operations

### Secure Error Handling

| Error Type | Response | Details Shown |
|------------|----------|---------------|
| Validation error | 400 `{success:false, message:"...", code:"VALIDATION_ERROR"}` | User-friendly message only |
| Duplicate entry | 409 `{success:false, message:"...", code:"DUPLICATE_ENTRY"}` | No internal details |
| Not found | 404 `{success:false, message:"...", code:"RESOURCE_NOT_FOUND"}` | Generic message |
| Auth error | 401/403 `{success:false, message:"...", code:"AUTH_ERROR"}` | No auth detail leaks |
| Server error | 500 `{success:false, message:"Internal server error", code:"INTERNAL_SERVER_ERROR"}` | **Never** stack traces, error objects |
| OTP errors | 400 `{success:false, message:"OTP expired"}` | No "wrong attempt count" leaks |

**Global Error Handler**:

```javascript
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
});
```

### Session Security

- **JWT Access Token**: 24-hour expiry, signed with secret
- **Refresh Token**: 7-day expiry, stored hashed in DB
- **Cookie Attributes**: 
  - `httpOnly: true`
  - `secure: true` (HTTPS only)
  - `sameSite: 'strict'`
  - `maxAge: 24 * 60 * 60 * 1000` (1 day)
- **Invalidation on**:
  - Logout endpoint call
  - Password/PIN change
  - New device login (optional: invalidate all others)
  - Session timeout expiration
- **Concurrent Session Limit**: Configurable (default: 1 per user, or 2-3)

### Frontend Security Practices

- **No sensitive data in localStorage** (as specified in requirements)
- **All state in React state / Zustand** (volatile, memory-only)
- **FLAG_SECURE** on activities displaying sensitive data
- **Clipboard clearing** on copy operations (best effort)
- **No console.log** of sensitive information
- **Component-level authorization**: Protected routes, conditional rendering
- **Input sanitization** on all forms (Zod validation)

### Dependency Vulnerability Management

```
1. Regular audits: npm audit (auto on npm install)
2. Critical CVEs: addressed within 7 days
3. Dependency updates: tested in staging before production
4. Lock file: package-lock.json committed to repo
5. Peer review: New dependencies reviewed before install
6. Known vulnerable deps: removed or mitigated immediately
```

### Secure Development Lifecycle (SDL)

| Phase | Activity | Deliverable |
|-------|----------|-------------|
| **Plan** | Threat modeling, risk assessment | Threat model document |
| **Design** | Secure architecture, key design | Architecture diagrams |
| **Implement** | Secure coding practices, encryption | Code review checklist |
| **Test** | Security testing, penetration testing | Test reports |
| **Deploy** | Environment config, secrets management | Deployment guide |
| **Maintain** | Vulnerability monitoring, updates | Ongoing maintenance plan |

---

## Security Limitations (Honest Disclosures)

### Cannot Guarantee Security On

1. **Compromised/Rooted Devices**
   - If device is rooted/jailbroken, all bets are off
   - Keystore may be extractable
   - Screenshots possible despite FLAG_SECURE
   - Malware can keylog PIN entry
   
   **Disclosure**: "Secure Save provides strong security on standard devices. On rooted or compromised devices, security features may be circumvented."

2. **Physical Device Access**
   - If attacker has unlocked physical access
   - Can attempt PIN brute-force (with delays)
   - Can take screenshots ( mitigated by FLAG_SECURE)
   - Can remove SD card (if applicable)
   
   **Disclosure**: "If your device is lost or stolen, enable remote wipe immediately. Secure Save's encryption protects data if the device remains locked."

3. **Master Key Escrow**
   - We do not store master encryption keys
   - If both PIN and recovery key are lost: data is unrecoverable
   - No backdoors or master keys exist
   
   **Disclosure**: "If you lose both your login PIN and your recovery key, we cannot recover access to your encrypted data. This is an intentional design choice."

4. **Network Interception**
   - HTTPS everywhere in production
   - However: public Wi-Fi risks, rogue access points
   - VPN recommended for sensitive operations
   
   **Disclosure**: "Always use Secure Save over trusted, private networks. Public Wi-Fi may expose metadata even with HTTPS."

### What Users Should Know

- **PIN is not the encryption key**: It unlocks access to key material
- **Recovery key is separate and critical**: Loss = data loss
- **Regular backups of recovery key recommended** (in secure location)
- **App updates may change key versions**: Re-encryption on next vault unlock
- **Device migration**: New device requires re-registration (data migration possible with recovery key)

### Transparency Statement (to display in app Settings)

> "Security is a defense-in-depth system. Your 4-6 digit PIN unlocks hardware-backed key material stored in Android Keystore (where available). Your vault encryption key (AES-256-GCM) never leaves your device in plaintext. If you lose both your PIN and your recovery key, your encrypted data cannot be recovered — this is an intentional security design. We never store master keys or backdoors. On rooted or jailbroken devices, standard security guarantees do not apply."

---

## Compliance Checklist

- [x] Client-side encryption (AES-256-GCM) for all sensitive data
- [x] No plaintext secrets in database or logs
- [x] Separate PIN, vault key, recovery key hierarchies
- [x] bcrypt password hashing (12 rounds) for PIN storage
- [x] JWT sessions with HttpOnly Secure cookies
- [x] OTP rate limiting (5 attempts, 60s cooldown)
- [x] Progressive PIN failure delays
- [x] HTTPS-only production API
- [x] CORS configuration (development + production)
- [x] NoSQL injection protection
- [x] Secure error handling (no stack traces to clients)
- [x] Ownership validation on every resource
- [x] TTL indexes for OTP automatic cleanup
- [x] Android Keystore integration (where available)
- [x] FLAG_SECURE for sensitive screens
- [x] No localStorage for vault data
- [x] Dependency vulnerability monitoring
- [x] Documented security limitations
- [x] Honest recovery key loss communication