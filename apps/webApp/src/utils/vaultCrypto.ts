/**
 * Secure Save - Client-Side Cryptographic Vault Engine
 * Provides AES-256 authenticated encryption & decryption for vault items,
 * and cryptographically secure password generation.
 */

// Format: Base64 JSON containing { iv, ciphertext, tag } or standard AES-GCM envelope
export class VaultCrypto {
  private static defaultKeyPhrase = 'SecureSave-ClientVaultKey-v1';

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

  /**
   * Encrypts any JS object or string using AES-256-GCM with a fresh random 12-byte IV.
   * Never reuses an IV. Returns a self-contained serialized string.
   */
  static async encrypt(data: unknown, userSecret?: string): Promise<string> {
    const secret = userSecret || this.defaultKeyPhrase;
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();

    // 16-byte random salt and 12-byte random IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveCryptoKey(salt, secret);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      encoder.encode(plaintext)
    );

    // Pack: salt (16 bytes) + iv (12 bytes) + ciphertext/tag
    const combined = new Uint8Array(salt.length + iv.length + ciphertextBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertextBuffer), salt.length + iv.length);

    // Convert to Base64
    let binary = '';
    const bytes = combined;
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Decrypts an AES-256-GCM serialized payload.
   */
  static async decrypt<T = any>(encryptedBase64: string, userSecret?: string): Promise<T> {
    const secret = userSecret || this.defaultKeyPhrase;

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

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
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
   * Generates a cryptographically secure random password
   * matching Section 15.3 requirements.
   */
  static generatePassword(options: {
    length?: number;
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}): string {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
    } = options;

    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const nums = '23456789';
    const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = '';
    const guaranteed: string[] = [];

    if (uppercase) {
      pool += uppers;
      guaranteed.push(uppers[this.getRandomIndex(uppers.length)]);
    }
    if (lowercase) {
      pool += lowers;
      guaranteed.push(lowers[this.getRandomIndex(lowers.length)]);
    }
    if (numbers) {
      pool += nums;
      guaranteed.push(nums[this.getRandomIndex(nums.length)]);
    }
    if (symbols) {
      pool += syms;
      guaranteed.push(syms[this.getRandomIndex(syms.length)]);
    }

    if (!pool) {
      pool = lowers + nums;
    }

    const remainingLength = Math.max(0, length - guaranteed.length);
    const randomChars: string[] = [];
    const randomBytes = crypto.getRandomValues(new Uint8Array(remainingLength));

    for (let i = 0; i < remainingLength; i++) {
      randomChars.push(pool[randomBytes[i] % pool.length]);
    }

    // Combine and shuffle
    const allChars = [...guaranteed, ...randomChars];
    for (let i = allChars.length - 1; i > 0; i--) {
      const j = this.getRandomIndex(i + 1);
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }

    return allChars.join('');
  }

  private static getRandomIndex(max: number): number {
    const randomArray = crypto.getRandomValues(new Uint32Array(1));
    return randomArray[0] % max;
  }
}
