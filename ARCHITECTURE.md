# Secure Save - System Architecture & Engineering Specifications

## 1. High-Level Architecture Overview

Secure Save is built upon a **Zero-Knowledge Client-Side Cryptographic Architecture**.
All sensitive vault items (Passwords, Payment Cards, Bank Accounts, Notes, and Files) are encrypted on the user's client device (Web Browser, iOS, or Android) using **AES-256-GCM** before any network transmission. The backend server and database only ever store and index encrypted envelopes (`encryptedPayload`), an authentication tag, and cryptographic salts/IVs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION TIER                             │
│                                                                        │
│   Web App (React 18 + TS + Tailwind)       Mobile App (Capacitor + React)│
│       │                                          │                     │
│       ▼                                          ▼                     │
│   Domain Services (Auth, Password, Card, Bank, Collections)           │
│       │                                                                │
│       ▼                                                                │
│   Client-Side Vault Engine (AES-256-GCM / PBKDF2 / SHA-256)           │
│       │                                                                │
│       ▼                                                                │
│   API Client Interceptors (JWT Bearer Token + Request ID Correlation)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY TIER                             │
│                                                                        │
│   Express 4 + TypeScript Node.js Runtime                               │
│   ├── Security Middleware (Helmet CSP, CORS Whitelisting, Proxy Trust) │
│   ├── Abuse Prevention (Express-Rate-Limit per IP)                    │
│   ├── Correlation IDs (X-Request-ID Header Generation & Propagation)  │
│   └── Centralized Error Handling & AppError Hierarchy                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ Auth Module  │             │ Vault Modules│             │ Notification │
│ User, PIN,   │             │ Passwords,   │             │ Nodemailer   │
│ Session JWT, │             │ Cards, Banks,│             │ Transactional│
│ OTP Lifecycle│             │ Collections  │             │ SMTP Service │
└──────┬───────┘             └──────┬───────┘             └──────────────┘
       │                            │
       └────────────────────────────┼────────────────────────────┐
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            DATA ACCESS TIER                            │
│                                                                        │
│   MongoDB Atlas / Local MongoDB                                        │
│   ├── Mongoose Schema Models with Compound Indexes                     │
│   ├── TTL Auto-Expiring Collections (OTP Tokens: 5-min TTL)           │
│   └── User-isolated Vault Collections                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure & Module Boundaries

The project is structured as an npm workspaces monorepo:

```
Secure Save/
├── apps/
│   ├── api/                    # Express REST API (Node.js + Mongoose + TypeScript)
│   │   ├── src/
│   │   │   ├── config/         # Database and server runtime configurations
│   │   │   ├── middleware/     # Error handler, JWT authentication, Request ID
│   │   │   ├── modules/        # Domain-driven feature modules (auth, cards, banks, etc.)
│   │   │   ├── utils/          # Cryptographic utilities and helpers
│   │   │   ├── app.ts          # Express application initialization & routes
│   │   │   └── server.ts       # Server listener & database bootstrap
│   │   └── tests/              # Vitest test suite (Auth, Cards, Passwords, etc.)
│   │
│   ├── webApp/                 # Web client (Vite + React 18 + Tailwind CSS + PWA)
│   │   └── src/
│   │       ├── components/     # Atomic reusable UI components (Nav, Modals, Buttons)
│   │       ├── features/       # Feature views (auth, dashboard, cards, banks, etc.)
│   │       ├── services/       # Domain-driven API services (authService, cardService, etc.)
│   │       ├── store/          # Zustand client-state stores (authStore)
│   │       ├── utils/          # Client-side AES-256 vault encryption engine
│   │       └── styles/         # Global Tailwind design system styles
│   │
│   └── mobile/                 # Cross-platform mobile client (Capacitor + React 18)
│       ├── android/            # Native Android Studio project & Gradle build
│       └── src/                # Mirror of mobile-optimized React client application
│
├── packages/
│   └── shared-types/           # Common TypeScript types, payload interfaces, & API contracts
│       └── src/index.ts        # Single source of truth for contracts across all tiers
│
├── .github/workflows/          # GitHub Actions CI/CD pipelines
│   └── build-apk.yml           # Automated multi-platform builds (Android APK & iOS IPA)
├── ARCHITECTURE.md             # This document
├── API.md                      # Comprehensive REST API specifications
└── CONTRIBUTING.md             # Contribution guidelines & coding standards
```

---

## 3. Cryptographic Specification

### Zero-Knowledge AES-256-GCM Vault Engine

1. **Key Derivation (PBKDF2):**
   - Algorithm: `PBKDF2`
   - Hash: `SHA-256`
   - Salt: Cryptographically random 16-byte `Uint8Array` generated via `crypto.getRandomValues()`
   - Iterations: `100,000` rounds
   - Derived Key: 256-bit AES-GCM `CryptoKey`
2. **Authenticated Encryption:**
   - Cipher: `AES-GCM` (Galois/Counter Mode)
   - Initialization Vector (IV): Fresh, cryptographically random 12-byte IV per encryption operation
   - Authenticated Tag: Embedded in the AES-GCM ciphertext
   - Packing format: `[16-byte Salt] + [12-byte IV] + [Ciphertext + Auth Tag]` encoded as standard Base64 string.
3. **Password Generator:**
   - Character selection uses `crypto.getRandomValues(new Uint32Array(length))` modulo character-pool bounds to prevent modulo bias.

---

## 4. State Management Architecture

- **Server / Network State:** Managed via `@tanstack/react-query` with explicit query keys (`['passwords-list']`, `['cards-list']`, `['banks-list']`). Automatic cache invalidation occurs immediately upon successful write/update/delete mutations.
- **Client Application State:** Managed via `zustand` with selective persistence (`persist` middleware).
  - Authentication Token (`token`) and User Profile (`user`) are maintained in volatile memory for security.
  - `rememberedEmail` is persisted in local storage as a user convenience to accelerate PIN entry.

---

## 5. Security & Defense in Depth

1. **Helmet Security Headers:** Content Security Policy, X-Content-Type-Options, Frameguard against clickjacking.
2. **CORS Isolation:** Strict origin whitelisting with support for production subdomains (`*.mraks.dev`, `*.vercel.app`) and native mobile schemes (`capacitor://localhost`).
3. **Rate Limiting:** IP-based sliding window rate limiter prevents automated credential stuffing or OTP flood attacks.
4. **Correlation IDs:** Every inbound request receives an `X-Request-ID` UUID for tracing.
5. **No Secrets in Source:** All sensitive credentials, database connection strings, and SMTP credentials load strictly via environment variables.
