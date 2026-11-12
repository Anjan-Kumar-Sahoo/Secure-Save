import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'AES-256-GCM';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

class CryptoUtil {
  static generateSalt(): string {
    return randomBytes(SALT_LENGTH).toString('hex');
  }

  static deriveKeyFromPassword(password: string, salt: string, iterations: number = ITERATIONS): Buffer {
    const key = createHash('sha256');
    key.update(password + salt);
    for (let i = 0; i < iterations; i++) {
      key.update(key.digest());
    }
    const derivedKey = key.digest();
    return derivedKey.slice(0, KEY_LENGTH);
  }

  static encrypt(plaintext: string, key: Buffer, salt?: string): { encrypted: string; salt: string } {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    const encryptedWithTag = Buffer.concat([
      iv,
      encrypted,
      cipher.final()
    ]);

    return {
      encrypted: encryptedWithTag.toString('hex'),
      salt: salt || this.generateSalt()
    };
  }

  static decrypt(encryptedHex: string, key: Buffer, iv?: Buffer, tag?: Buffer): string {
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const iv = iv || encrypted.subarray(0, IV_LENGTH);
    const ciphertext = encrypted.subarray(IV_LENGTH, IV_LENGTH + encrypted.length - IV_LENGTH - TAG_LENGTH);
    const authTag = encrypted.subarray(encrypted.length - TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(''))
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return plaintext.toString('utf8');
  }
}

export { CryptoUtil };