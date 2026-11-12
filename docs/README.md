# Secure Save

## Personal Secure Vault Application

Secure Save is a personal digital vault application that allows authenticated users to securely store and manage sensitive information including:

- Debit cards and credit cards
- Passwords and login credentials
- Bank account details
- Personal notes and text documents
- Images, videos, and audio recordings
- Custom collections organized through user-defined titles

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS (dark theme)
- React Router DOM
- Lucide React icons
- React Hook Form + Zod validation
- TanStack Query (server state)
- Zustand (client state)

### Backend
- Node.js + Express.js
- TypeScript strict mode
- MongoDB Atlas (primary database)
- Mongoose ODM
- Nodemailer (SMTP)
- JWT authentication
- Helmet security headers
- Express rate limiting

### Mobile & Capacitor
- Capacitor for Android integration
- Native Android project
- Android Keystore security
- Secure local storage

### Development & Testing
- ESLint + Prettier
- TypeScript strict mode
- Vitest + React Testing Library
- Supertest (backend API tests)

## Prerequisites

- Node.js 20+
- npm or yarn
- MongoDB Atlas account
- SMTP email service account
- Android Studio (for APK generation)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://your-repo-url/securesave.git
cd securesave
```

### 2. Install Dependencies

```bash
# Root level
npm install

# API backend
cd apps/api
npm install

# Mobile frontend
cd ../mobile
npm install
```

### 3. Environment Configuration

Create `.env` files:

**API Backend** (`apps/api/.env`):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secure-save
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@secure-save.com
SMTP_FROM_NAME=Secure Save
JWT_SECRET=your-super-secret-key
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
MAX_OTP_ATTEMPTS=5
OTP_EXPIRY_SECONDS=300
OTP_RESEND_COOLDOWN=60
```

**Mobile Frontend** (`apps/mobile/.env`):
```
VITE_API_URL=http://localhost:3000/api
```

### 4. Deploying the API on Render

The Render service must be allowed to connect to the MongoDB Atlas cluster:

1. In MongoDB Atlas, open **Security → Network Access**.
2. Add the Render service's outbound IP address range. If the service does not
   have a fixed outbound IP, use Atlas's `0.0.0.0/0` entry only when you
   understand the security implications; a fixed outbound IP is preferable.
3. In Render, set the `MONGODB_URI` environment variable to the Atlas
   connection string, including the database name and URL-encoded credentials.
4. Confirm the MongoDB database user has access to that database.

The API intentionally exits when the production database cannot be reached,
instead of starting with a local MongoDB fallback. A
`MongooseServerSelectionError` mentioning an IP whitelist means the Atlas
Network Access rule is missing or does not include Render.

### 5. Start Development Servers

```bash
# API server (from apps/api directory)
npm run dev

# Mobile dev server (from apps/mobile directory)
npm run dev
```

### 6. Android APK Generation

```bash
# Sync Capacitor with Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build release APK in Android Studio
# Generate signed release APK
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both API and mobile dev servers |
| `npm run build:api` | Build TypeScript API |
| `npm run build:mobile` | Build TypeScript + Vite mobile |
| `npm test` | Run Vitest test suite |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npx cap sync android` | Sync Capacitor with native project |
| `npx cap open android` | Open Android Studio |

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Full build (API + Mobile) |
| `vite build` | Build mobile React app |
| `tsc` | TypeScript compile |

## Security Features

- **Client-side AES-256-GCM encryption** for all sensitive data
- **Bcrypt password hashing** (12 rounds) for PIN storage
- **JWT sessions** with HttpOnly secure cookies
- **OTP verification** with 5-minute expiry, 5 attempt limit
- **Rate limiting** on all auth endpoints
- **Helmet security headers**
- **CORS configuration** for production domains only
- **No plaintext secrets** in source code or logs
- **MongoDB Atlas** with least-privilege user, TTL indexes

## Contact

- **Email**: support@secure-save.com
- **© 2026 Secure Save. All rights reserved.**
- **Made with ♥ by AK**