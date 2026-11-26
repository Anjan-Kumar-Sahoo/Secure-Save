# Secure Save - Contribution & Engineering Guidelines

Thank you for contributing to Secure Save! To maintain enterprise software quality and strict security boundaries, please adhere to these standards.

---

## 1. Zero-Knowledge Cryptographic Rule

**Fundamental Architectural Constraint:**
- Under **no circumstances** should unencrypted plaintext passwords, card numbers, CVVs, or account numbers be transmitted to or stored in backend logs, query parameters, or databases.
- Encryption and decryption must always occur inside the client using `VaultCrypto` before invoking backend domain services.

---

## 2. Directory & Architecture Conventions

- **Shared Types:** Any data contract, DTO, or entity shared between backend and frontend must reside in `packages/shared-types`.
- **Domain Services:** Do not invoke `api.get()` or `api.post()` directly within React UI components. Encapsulate all API and cryptographic logic inside `src/services/*Service.ts`.
- **UI Components:** UI components in `src/features/*` should strictly focus on rendering, user interaction, form validation, and reactive bindings.

---

## 3. Code Quality & Naming Standards

- **Files & Components:** PascalCase for React components (`PasswordListing.tsx`, `Hero3DCanvas.tsx`).
- **Services & Utilities:** camelCase for service modules (`authService.ts`, `vaultCrypto.ts`).
- **Constants:** UPPER_SNAKE_CASE for genuine constants (`RATE_LIMIT_WINDOW_MS`).
- **TypeScript:** Avoid `any` where concrete shared types exist. Use strict typing for all service responses and parameters.

---

## 4. Verification Workflow

Before submitting a Pull Request or pushing commits, execute:

```bash
# 1. Rebuild shared contracts
npm run build --workspace=@secure-save/shared-types

# 2. Run backend Vitest suite
npm test --workspaces

# 3. Verify production web build
npm run build:webapp

# 4. Verify mobile build
npm run build:mobile
```
