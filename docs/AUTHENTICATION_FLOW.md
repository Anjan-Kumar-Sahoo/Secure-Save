# Secure Save - Authentication Flow

## Overview

Complete authentication lifecycle from first-time registration through ongoing login, PIN recovery, and session management. All flows are designed with security-first principles and user experience in mind.

---

## 3.1 First-Time Registration Flow

### Step-by-Step Process

| Step | Action | Backend | Result |
|------|--------|---------|--------|
| 1 | User opens app for first time | — | Registration screen displayed |
| 2 | User enters email, clicks Continue | — | Email received |
| 3 | Backend checks email uniqueness | `SELECT * FROM users WHERE email = ?` | If exists: error "Email already registered" If not: proceed |
| 4 | Backend generates 6-digit OTP | `crypto.randomInt(100000, 999999)` | Secure random number |
| 5 | OTP hashed with bcrypt (10 rounds) | `bcrypt.hash(otp, 10)` | Secure storage, never plaintext |
| 6 | OTP stored in `otp_challenges` collection | `INSERT INTO otp_challenges` | DB record with expiresAt (1h TTL) |
| 7 | OTP sent via SMTP HTML email | `sendEmail()` | Professional email template delivered |
| 8 | OTP verification screen displayed | — | User prompted for code |
| 9 | User enters 6-digit OTP | — | Validation initiated |
| 10 | Backend verifies OTP | `bcrypt.compare(otp, otpHash)` + attempt check | If valid: proceed; if invalid: increment attempts |
| 11 | User creates login PIN | — | PIN entry screen |
| 12 | PIN confirmed (entered twice) | — | Match validation |
| 13 | PIN hashed with bcrypt (12 rounds) | `bcrypt.hash(pin, 12)` | Stored in `recoveryConfiguration.recoveryKeyEncrypted` |
| 14 | User status updated to `active` | `UPDATE users SET status = 'active'` | Account fully activated |
| 15 | Vault encryption key generated client-side | `AES-256-GCM random key` | Never transmitted to backend |
| 16 | Navigation to dashboard | — | Protected routes now accessible |

### OTP Requirements (Enforced)

- **Length**: 6 digits only
- **Expiry**: 5 minutes (300 seconds) from generation
- **Max Attempts**: 5 incorrect entries per OTP challenge
- **Resend Cooldown**: 60 seconds minimum between resends
- **Rate Limiting**: By account email AND by source IP address
- **Storage**: Only secure hash (bcrypt) — never plaintext OTP
- **Invalidation**: Previously issued OTPs invalidated when new one generated
- **Never Returned**: OTP values never in API responses or logs

### SMTP Email Template

Professional HTML email containing:

- Secure Save branding (logo, color scheme)
- Verification OTP (large, prominent display)
- Expiration information ("Expires in 5 minutes")
- Security warning ("Never share this code")
- Clean responsive email design
- Footer with copyright and contact

---

## 3.2 Login Flow

### Step-by-Step Process

| Step | Action | Backend | Result |
|------|--------|---------|--------|
| 1 | User opens app (or returns after background) | — | Login screen displayed |
| 2 | User enters email + 4-6 digit PIN | — | Credentials received |
| 3 | Backend looks up user by email | `SELECT * FROM users WHERE email = ?` | If not found: "Invalid credentials" |
| 4 | Backend compares PIN against stored hash | `bcrypt.compare(pin, recoveryKeyEncrypted)` | If valid: proceed; if invalid: increment failure counter |
| 5 | Failure counter checked | `< 5: proceed; >= 5: lock account` | Progressive delays apply |
| 6 | JWT access token issued | `jwt.sign({ userId, email }, JWT_SECRET)` | Signed cookie `__Secure-sid` set |
| 7 | Vault encryption key decrypted locally | PIN + Android Keystore → derive key | App unlocks, dashboard displayed |
| 8 | Inactivity timer started | — | Configurable timeout (default 30 min) |
| 9 | App background handling | — | Vault locks on app switch |

### PIN Security Requirements

- **Length**: 4-6 digits (user choice during registration)
- **Never stored as plaintext**: Only bcrypt hash in user record
- **Not sent to backend as plaintext**: Comparable via bcrypt verify
- **Progressive delays**: 
  - 1st failure: immediate retry
  - 2nd failure: 5-second delay
  - 3rd failure: 30-second delay
  - 4th failure: 2-minute delay
  - 5th failure: account lockout, support contact
- **Session expiration**: Configurable inactivity timeout
- **Background locking**: Vault locks when app moves to background
- **Flag Secure**: Screens displaying PIN sensitive data

### Forgot Login PIN Flow

| Step | Action | Backend | Result |
|------|--------|---------|--------|
| 1 | User clicks "Forgot Login PIN" | — | Email entry screen |
| 2 | User enters registered email | — | Email validated |
| 3 | Backend checks email exists | `SELECT * FROM users WHERE email = ?` | If not found: "Email not registered" |
| 4 | Fresh OTP generated and sent | OTP generation + SMTP send | New 6-digit code |
| 5 | User receives OTP via email | — | User checks inbox |
| 6 | User enters OTP on screen | — | Verification initiated |
| 7 | Backend verifies OTP | Same flow as registration OTP | If valid: proceed |
| 8 | User creates new login PIN | PIN entry + confirmation | New PIN setup |
| 9 | PIN confirmed | Match validation | If match: proceed |
| 10 | Old PIN invalidated | — | Previous PIN no longer works |
| 11 | Vault reconfigured | Recovery key re-encrypted | Existing vault key preserved |
| 12 | Navigation to login screen | — | User logs in with new PIN |

### Critical: PIN Recovery Does NOT

- Destroy the encrypted vault
- Generate a new encryption key
- Lose existing stored data
- Reset the vault encryption key

### Recovery Mechanism

- **Separate recovery key** generated during initial registration
- Used to recover the vault encryption key if PIN is lost
- PIN unlocks access to protected key material
- If recovery key is unavailable: data cannot be recovered (documented limitation)
- No false promises about recovery

---

## 3.3 Session Management

### Login Session Flow

```
User Login
    │
    ▼
JWT token issued
    │
    ▼
__Secure-sid cookie set (HttpOnly, Secure, SameSite=Strict)
    │
    ▼
App checks cookie → vault unlocks
    │
    ▼
Inactivity timer started (default: 30 minutes)
    │
    ▼
Timer expires → session invalidated
    │
    ▼
Vault re-locks, navigate to login
```

### Logout Flow

```
User clicks Logout
    │
    ▼
Clear __Secure-sid cookie (expires immediately)
    │
    ▼
Clear sensitive in-memory state (PIN, keys, tokens)
    │
    ▼
Navigate to login screen
    │
    ▼
Vault locked, fresh authentication required
```

### Session Expiration

- **Access Token**: 24 hours (configurable)
- **Refresh Token**: 7 days (configurable)
- **Inactivity Timeout**: 30 minutes (configurable)
- **Background Handling**: App moved to background → 5-minute timer starts
- **Force Re-auth**: After timeout, full authentication required (not just PIN entry)

### Cross-Session Security

- **One active session per user** (can configure max 2-3)
- **Login from new device** invalidates previous sessions
- **Logout from all devices** endpoint available
- **Session revocation** on password change
- **Device metadata** stored for anomaly detection

---

## 3.4 PIN Recovery Flow (Detailed)

### When User Forgets PIN

1. **Access Point**: Login screen → "Forgot Login PIN" link
2. **Email Validation**: User enters registered email address
3. **Existence Check**: Backend confirms email is registered (no enumeration risk)
4. **OTP Generation**: Fresh 6-digit cryptographically secure OTP
5. **SMTP Delivery**: Professional email with OTP and expiration info
6. **OTP Verification**: User enters code, backend validates
7. **PIN Creation**: User enters new 4-6 digit PIN, confirms
8. **PIN Validation**: Both entries must match exactly
9. **Key Reconfiguration**: 
   - Old PIN hash invalidated
   - Vault encryption key re-wrapped with new key derivation
   - Existing data preserved (no decryption/rehash needed)
10. **Session Invalidation**: All active sessions cleared
11. **Login**: User authenticates with new PIN

### Recovery Key Hierarchy

```
Master Scenario:

user PIN (4-6 digits)
    │
    ▼
bcrypt hash (12 rounds) → stored in users.recoveryKeyEncrypted
    │
    ▼
Vault encryption key derived locally:
  PIN + Android Keystore → AES-256-GCM key
    │
    ▼
All sensitive data encrypted/decrypted with this key
    │
    ▼
Forgot PIN flow:
  │
  ├── Old PIN → invalidated
  │
  ├── Recovery key (generated at registration) used to
  │   re-derive key without data loss
  │
  └── New PIN → new key derivation
      │
      └── Data continues to work with new PIN
```

### If Recovery Key Is Unavailable

**Honest Notification:**
> "If you have lost both your login PIN and your recovery key, we cannot recover access to your vault. All encrypted data remains on the device but cannot be decrypted without the key. We do not store master keys or backdoors."

**What User Loses Access To:**
- All saved cards
- All passwords/credentials
- All bank details
- All collection items (text, images, videos, audio, files)
- All settings and preferences

**What User Retains:**
- Ability to create new account
- No data leakage (security preserved)
- Transparent communication about limitations

---

## 3.5 Session Security Controls

### Brute-Force Protection

| Scenario | Protection |
|----------|-----------|
| OTP verification | Max 5 attempts per challenge, 60s cooldown |
| PIN login | Progressive delays (5s → 30s → 2min → lockout) |
| Session cookie | HttpOnly, Secure, SameSite=Strict |
| IP monitoring | Flag suspicious IP patterns |
| Device fingerprinting | Track userAgent + deviceId |

### Rate Limiting by Endpoint

| Endpoint | Limit | Window | Response on Exceed |
|----------|-------|--------|-------------------|
| `/auth/register` | 3 per hour per email | 1 hour | 429 with `Retry-After` |
| `/auth/send-otp` | 5 per 30 min per email | 30 min | 429 with `Retry-After` |
| `/auth/verify-otp` | 10 per hour per email | 1 hour | 429 with `Retry-After` |
| `/auth/login` | 5 per 30 min per email | 30 min | 429 with `Retry-After` |
| `/auth/forgot-pin` | 3 per hour per email | 1 hour | 429 with `Retry-After` |
| General API | 100 per 60 sec per IP | 60 sec | 429 with `Retry-After` |

### Secure Cookie Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `httpOnly` | `true` | Prevent JS access, XSS protection |
| `secure` | `true` | Only sent over HTTPS |
| `sameSite` | `strict` | CSRF protection |
| `domain` | `secure-save.app` (prod) | Cookie scope |
| `path` | `/` | Available app-wide |
| `expires` | Session (max-age) | Cleared on browser close |

### HTTPS-Only Production

- **All API communication over HTTPS** (TLS 1.3 minimum)
- **No HTTP endpoints in production**
- **Certificate pinning** consideration for mobile
- **Mixed content blocked** in frontend
- **Service worker** for offline fallbacks only

### Authentication Middleware

```javascript
// Pseudocode for auth check
function authenticateToken(req, res, next) {
  const token = req.cookies.__Secure-sid || 
                req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}
```

### Ownership Validation

**Every resource endpoint must include:**

```javascript
// Pattern for all resource queries
const resource = await Model.findOne({
  _id: resourceId,
  userId: req.userId  // ← Critical: derived from auth, NOT client input
});

if (!resource) {
  return res.status(403).json({
    success: false,
    message: 'Authorization denied'
  });
}
```

**Never trust** user-supplied IDs in request body/params.
**Always derive** identity from authenticated session.

---

## Authentication Flow Diagrams

### New User Registration

```
┌─────────────────────────────────────────────────────────────┐
│                    NEW USER REGISTRATION                     │
├─────────────────────────────────────────────────────────────┤
│ 1. App launch (no existing account)                         │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────┐  Enter email  ┌─────────────────────┐ │
│  │ Registration    │ ──────────────▶ │  Backend: Check     │ │
│  │ Screen: Email   │                 │    email uniqueness │ │
│  └─────────────────┘                 └─────────────────────┘ │
│           │                                                       │
│           └─────────── OTP sent via SMTP (if unique) ──────┘ │
│                                                 │             │
│                            2. User checks email          │
│                                                 ▼             │
│                                 3. Enter OTP on screen       │
│                                                 │             │
│                            4. Backend verifies OTP         │
│                                                 │             │
│                            5. Create PIN (confirm twice)   │
│                                                 │             │
│                            6. PIN hashed, vault key gen      │
│                                                 │             │
│                            7. Status → active              │
│                                                 │             │
│                            8. JWT issued, dashboard          │
│                                                 ▼             │
│                         ✅ Registration complete!         │
└─────────────────────────────────────────────────────────────┘
```

### User Login

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN                                │
├─────────────────────────────────────────────────────────────┤
│ 1. App launch (existing account)                            │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────┐  Enter PIN  ┌─────────────────────┐ │
│  │ Login Screen    │ ──────────────▶ │  Backend: Find user │ │
│  │: Email + PIN    │                 │    by email         │ │
│  └─────────────────┘                 └─────────────────────┘ │
│           │                                                       │
│           └─────────── Compare PIN ──────────────────────┘ │
│                                                 │             │
│                            5. PIN valid?                │
│             │           │                       │             │
│             ▼           ▼                       ▼             │
│      ✅ Yes: JWT issued, vault unlocks               │
│      ❌ No:  Failure counter + progressive delays     │
│                                                 │             │
│                            6. Inactivity timer started │
│                                                 │             │
│                            7. App background → lock    │
│                                                 ▼             │
│                         ✅ Login complete or denied   │
└─────────────────────────────────────────────────────────────┘
```

### Forgot PIN Recovery

```
┌─────────────────────────────────────────────────────────────┐
│                    FORGOT PIN RECOVERY                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Login screen → "Forgot PIN"                             │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────┐  Enter email  ┌─────────────────────┐ │
│  │ Forgot PIN      │ ──────────────▶ │  Backend: Verify    │ │
│  │ Screen          │                 │    email exists     │ │
│  └─────────────────┘                 └─────────────────────┘ │
│           │                                                       │
│           └─────────── OTP sent (if exists) ──────┘ │
│                                                 │             │
│                            2. User checks email          │
│                                                 ▼             │
│                                 3. Enter OTP on screen       │
│                                                 │             │
│                            4. Backend verifies OTP         │
│                                                 │             │
│                            5. Create new PIN (confirm)     │
│                                                 │             │
│                            6. Old PIN invalidated          │
│                                                 │             │
│                            7. Vault reconfigured (key safe)│
│                                                 │             │
│                            8. Session invalidated          │
│                                                 ▼             │
│                         ✅ New PIN set, login possible   │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Limitations & Honest Disclosures

### What Secure Save Protects Against

- **Remote attacks**: OTP brute-force, PIN guessing, session hijacking
- **Database leaks**: No plaintext secrets stored
- **Local device theft**: Android Keystore protection, FLAG_SECURE
- **Clipboard exposure**: Sensitive data cleared when practical

### What Secure Save Does NOT Claim

- **Rooted/jailbroken devices**: Security cannot be guaranteed on compromised devices
- **Cloud backup**: Data only on device + MongoDB Atlas (user-controlled)
- **Physical device access**: If someone has unlocked physical access, security boundaries may differ
- **Perfect encryption**: AES-256-GCM is industry-standard but not mathematically proven unbreakable
- **Recovery without keys**: If both PIN and recovery key are lost: data is unrecoverable

### Documented Limitations

1. **No master key escrow**: We do not store master encryption keys
2. **Recovery key loss = data loss**: If both PIN and recovery key lost: data unrecoverable
3. **Rooted devices**: Security features may be circumvented
4. **Physical access**: If device is unlocked, all bets are off (FLAG_SECURE mitigates screenshots)
5. **Backup responsibility**: User responsible for device backups (iCloud, Google Drive not used for vault data)

### Transparency Statement

> "Secure Save employs defense-in-depth encryption and key management. The six-digit PIN is not used as the encryption key directly; rather, it unlocks hardware-backed key material. If both the PIN and the recovery key are lost, the encrypted data cannot be recovered. This is an intentional design choice to prevent master key exposure."

---

## Compliance & Best Practices

### Industry Standards Followed

- **AES-256-GCM**: Authenticated encryption standard
- **bcrypt**: Adaptive hash with work factor (12 rounds)
- **JWT**: Industry-standard token format (RFC 7519)
- **HTTPS/TLS**: Transport encryption (TLS 1.3)
- **HTTP-only cookies**: XSS protection
- **SameSite=Strict**: CSRF protection
- **TTL indexes**: Automated data cleanup

### Security Headers (Helmet.js)

- `contentSecurityPolicy`: Restrict inline scripts
- `xXssProtection`: Legacy XSS filter
- `xFrameOptions`: Clickjacking protection
- `xContentTypeOptions`: MIME type sniffing
- `referrerPolicy`: Control referrer information

### Dependency Vulnerability Checks

- Regular `npm audit` runs
- Critical dependencies updated within 7 days of CVE publication
- No known vulnerabilities in core crypto libraries
- Pin dependency versions in `package-lock.json`

### Security Testing Requirements

- OTP brute-force resistance (max 5 attempts)
- PIN progressive delay functionality
- Session expiration and re-authentication
- Cross-user data isolation
- Encryption/decryption round-trip verification
- Rate limit enforcement
- Error message sanitization (no stack traces to clients)