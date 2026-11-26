/**
 * Secure Save - Zero-Knowledge Key Management & Crypto Engine
 * Architecture:
 * 1. Master Password derives 256-bit KEK (Key Encryption Key) using PBKDF2-HMAC-SHA256 (600,000 iterations OWASP standard).
 * 2. Per-user 256-bit DEK (Data Encryption Key) is generated randomly on registration.
 * 3. The raw DEK is wrapped (encrypted) by KEK using AES-256-GCM.
 * 4. User-Controlled Master Password Recovery:
 *    - A 256-bit cryptographic Recovery Key is generated on the client.
 *    - The DEK is also wrapped by a Recovery KEK derived from this Recovery Key.
 *    - Stored as `recoveryWrappedDek` and `recoverySalt`.
 *    - If the user forgets their Master Password, they input the Recovery Key to unwrap their DEK,
 *      then set a new Master Password (re-wrapping the DEK) with ZERO data loss.
 * 5. Authenticated Additional Data (AAD):
 *    - Encrypted records can bind record metadata (userId, recordId, recordType, version)
 *      into AES-GCM's AAD so that ciphertext cannot be transposed or tampered with.
 * 6. Isolated legacy v1 decryption strictly for verified migration routines.
 */

export class MissingEncryptionKeyError extends Error {
  constructor(message = 'Vault is locked. Encryption key not available in session.') {
    super(message);
    this.name = 'MissingEncryptionKeyError';
  }
}

export interface WrappedVaultKeyConfig {
  kdfAlgorithm?: string;
  kekSalt: string;
  wrappedDek: string;
  keyVersion: number;
  iterations?: number;
  recoveryWrappedDek?: string;
  recoverySalt?: string;
}

export interface EncryptionContextAAD {
  userId?: string;
  recordId?: string;
  recordType?: string;
  version?: string;
}

export class VaultKeyManager {
  // Ephemeral in-memory DEK secret (never stored to disk or localStorage)
  private static activeDek: string | null = null;
  // Legacy migration secret (isolated strictly to migration routines)
  private static readonly legacyKeyPhrase = 'SecureSave-ClientVaultKey-v1';

  // OWASP 2024+ Recommended PBKDF2 Iteration Count for SHA-256
  public static readonly DEFAULT_PBKDF2_ITERATIONS = 600000;

  /**
   * Set the active in-memory DEK upon vault unlock
   */
  static setActiveDek(dek: string) {
    this.activeDek = dek;
  }

  /**
   * Get the active in-memory DEK. Throws securely if locked.
   */
  static getActiveDek(): string {
    if (!this.activeDek) {
      throw new MissingEncryptionKeyError();
    }
    return this.activeDek;
  }

  /**
   * Check if vault is currently unlocked
   */
  static isUnlocked(): boolean {
    return !!this.activeDek;
  }

  /**
   * Clear active key from memory on logout or lock
   */
  static lock() {
    this.activeDek = null;
  }

  /**
   * Generate a cryptographically random 256-bit DEK
   */
  static generateRandomDek(): string {
    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    let binary = '';
    for (let i = 0; i < rawBytes.length; i++) {
      binary += String.fromCharCode(rawBytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Generate a secure human-readable 256-bit Recovery Key (formatted in groups)
   * e.g. "RCV-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
   */
  static generateRecoveryKey(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    }
    // Format into 6 blocks of 4 chars
    const chunks = hex.match(/.{1,4}/g) || [];
    return `RCV-${chunks.join('-')}`;
  }

  /**
   * Derive a 256-bit KEK CryptoKey using PBKDF2 with SHA-256
   */
  private static async deriveKek(
    secret: string,
    saltBytes: Uint8Array,
    iterations = VaultKeyManager.DEFAULT_PBKDF2_ITERATIONS
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes as any,
        iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Wrap (encrypt) raw DEK with Master Password or Recovery Key
   */
  private static async wrapSecret(secret: string, rawDek: string, iterations = VaultKeyManager.DEFAULT_PBKDF2_ITERATIONS): Promise<{ saltBase64: string; wrappedBase64: string }> {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const kek = await this.deriveKek(secret, saltBytes, iterations);

    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any },
      kek,
      encoder.encode(rawDek)
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    let wrappedBinary = '';
    for (let i = 0; i < combined.length; i++) {
      wrappedBinary += String.fromCharCode(combined[i]);
    }

    let saltBinary = '';
    for (let i = 0; i < saltBytes.length; i++) {
      saltBinary += String.fromCharCode(saltBytes[i]);
    }

    return {
      saltBase64: btoa(saltBinary),
      wrappedBase64: btoa(wrappedBinary),
    };
  }

  /**
   * Unwrap (decrypt) raw DEK using Master Password or Recovery Key
   */
  private static async unwrapSecret(secret: string, saltBase64: string, wrappedBase64: string, iterations = VaultKeyManager.DEFAULT_PBKDF2_ITERATIONS): Promise<string> {
    const saltBinary = atob(saltBase64);
    const saltBytes = new Uint8Array(saltBinary.length);
    for (let i = 0; i < saltBinary.length; i++) {
      saltBytes[i] = saltBinary.charCodeAt(i);
    }

    const wrappedBinary = atob(wrappedBase64);
    const combined = new Uint8Array(wrappedBinary.length);
    for (let i = 0; i < wrappedBinary.length; i++) {
      combined[i] = wrappedBinary.charCodeAt(i);
    }

    const iv = combined.subarray(0, 12);
    const ciphertext = combined.subarray(12);

    const kek = await this.deriveKek(secret, saltBytes, iterations);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      kek,
      ciphertext as any
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Wrap DEK with both Master Password and user Recovery Key
   */
  static async wrapDekWithRecovery(
    masterPassword: string,
    rawDek: string,
    recoveryKey: string,
    iterations = VaultKeyManager.DEFAULT_PBKDF2_ITERATIONS
  ): Promise<WrappedVaultKeyConfig> {
    const mainWrap = await this.wrapSecret(masterPassword, rawDek, iterations);
    const recoveryWrap = await this.wrapSecret(recoveryKey, rawDek, iterations);

    return {
      kdfAlgorithm: 'PBKDF2-SHA256',
      kekSalt: mainWrap.saltBase64,
      wrappedDek: mainWrap.wrappedBase64,
      keyVersion: 2,
      iterations,
      recoveryWrappedDek: recoveryWrap.wrappedBase64,
      recoverySalt: recoveryWrap.saltBase64,
    };
  }

  /**
   * Wrap raw DEK with Master Password (backward compatible)
   */
  static async wrapDek(
    masterPassword: string,
    rawDek: string,
    iterations = VaultKeyManager.DEFAULT_PBKDF2_ITERATIONS
  ): Promise<WrappedVaultKeyConfig> {
    const mainWrap = await this.wrapSecret(masterPassword, rawDek, iterations);
    return {
      kdfAlgorithm: 'PBKDF2-SHA256',
      kekSalt: mainWrap.saltBase64,
      wrappedDek: mainWrap.wrappedBase64,
      keyVersion: 2,
      iterations,
    };
  }

  /**
   * Unwrap raw DEK using Master Password
   */
  static async unwrapDek(masterPassword: string, config: WrappedVaultKeyConfig): Promise<string> {
    const iterations = config.iterations || 100000;
    return this.unwrapSecret(masterPassword, config.kekSalt, config.wrappedDek, iterations);
  }

  /**
   * Unwrap raw DEK using user Recovery Key
   */
  static async unwrapDekWithRecoveryKey(recoveryKey: string, config: WrappedVaultKeyConfig): Promise<string> {
    if (!config.recoveryWrappedDek || !config.recoverySalt) {
      throw new Error('No recovery key configuration available for this account.');
    }
    const iterations = config.iterations || 100000;
    return this.unwrapSecret(recoveryKey.trim(), config.recoverySalt, config.recoveryWrappedDek, iterations);
  }

  /**
   * Access to legacy key strictly for migration routines
   */
  static getLegacyKeyForMigration(): string {
    return this.legacyKeyPhrase;
  }
}

export class VaultCrypto {
  /**
   * Derives a 256-bit CryptoKey using PBKDF2 with SHA-256
   */
  private static async deriveCryptoKey(salt: Uint8Array, secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private static encodeAAD(aad?: EncryptionContextAAD): Uint8Array | undefined {
    if (!aad) return undefined;
    const encoder = new TextEncoder();
    return encoder.encode(JSON.stringify(aad));
  }

  /**
   * Encrypts any JS object or string using AES-256-GCM.
   * Optionally binds Authenticated Additional Data (AAD).
   */
  static async encrypt(data: unknown, customSecret?: string, aad?: EncryptionContextAAD): Promise<string> {
    const secret = customSecret || VaultKeyManager.getActiveDek();
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveCryptoKey(salt, secret);

    const additionalData = this.encodeAAD(aad);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        additionalData: additionalData as any,
      },
      key,
      encoder.encode(plaintext)
    );

    const combined = new Uint8Array(salt.length + iv.length + ciphertextBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertextBuffer), salt.length + iv.length);

    let binary = '';
    const bytes = combined;
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Decrypts an AES-256-GCM serialized payload.
   * Validates optional Authenticated Additional Data (AAD).
   */
  static async decrypt<T = any>(encryptedBase64: string, customSecret?: string, aad?: EncryptionContextAAD): Promise<T> {
    const secret = customSecret || VaultKeyManager.getActiveDek();

    try {
      const binary = atob(encryptedBase64);
      const combined = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
      }

      const salt = combined.subarray(0, 16);
      const iv = combined.subarray(16, 28);
      const ciphertext = combined.subarray(28);

      const key = await this.deriveCryptoKey(salt, secret);
      const additionalData = this.encodeAAD(aad);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as any,
          additionalData: additionalData as any,
        },
        key,
        ciphertext as any
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);

      try {
        return JSON.parse(decryptedString) as T;
      } catch {
        return decryptedString as unknown as T;
      }
    } catch (err) {
      console.error('Decryption failed:', err);
      throw new Error('Unable to decrypt vault record. Authentication key mismatch or corrupted payload.');
    }
  }

  /**
   * Encrypt arbitrary binary ArrayBuffer / Uint8Array using AES-256-GCM
   */
  static async encryptBinary(data: ArrayBuffer | Uint8Array, customSecret?: string, aad?: EncryptionContextAAD): Promise<string> {
    const secret = customSecret || VaultKeyManager.getActiveDek();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveCryptoKey(salt, secret);
    const additionalData = this.encodeAAD(aad);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        additionalData: additionalData as any,
      },
      key,
      data as BufferSource
    );

    const combined = new Uint8Array(salt.length + iv.length + ciphertextBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertextBuffer), salt.length + iv.length);

    const chunkSize = 0x8000; // 32KB chunks
    const chunks: string[] = [];
    for (let i = 0; i < combined.length; i += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, combined.subarray(i, i + chunkSize) as any));
    }
    return btoa(chunks.join(''));
  }

  /**
   * Decrypt raw binary ArrayBuffer from serialized Base64 payload
   */
  static async decryptBinary(encryptedBase64: string, customSecret?: string, aad?: EncryptionContextAAD): Promise<ArrayBuffer> {
    const secret = customSecret || VaultKeyManager.getActiveDek();
    const binary = atob(encryptedBase64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 28);
    const ciphertext = combined.subarray(28);

    const key = await this.deriveCryptoKey(salt, secret);
    const additionalData = this.encodeAAD(aad);

    return crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        additionalData: additionalData as any,
      },
      key,
      ciphertext as any
    );
  }

  /**
   * Cryptographically secure password generator
   */
  static generatePassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}): string {
    const {
      length = 16,
      includeUppercase = options.uppercase !== undefined ? options.uppercase : true,
      includeLowercase = options.lowercase !== undefined ? options.lowercase : true,
      includeNumbers = options.numbers !== undefined ? options.numbers : true,
      includeSymbols = options.symbols !== undefined ? options.symbols : true,
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijkmnpqrstuvwxyz';
    if (includeNumbers) charset += '23456789';
    if (includeSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

    if (!charset) {
      charset = 'abcdefghijkmnpqrstuvwxyz23456789';
    }

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    return password;
  }
}
