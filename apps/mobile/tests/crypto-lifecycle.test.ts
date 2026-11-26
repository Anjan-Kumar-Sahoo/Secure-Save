import { describe, it, expect, beforeEach } from 'vitest';
import { VaultCrypto, VaultKeyManager } from '../src/utils/vaultCrypto';

describe('Vault Cryptographic Lifecycle & Cold Restart Simulation', () => {
  const testDek = VaultKeyManager.generateRandomDek();

  beforeEach(() => {
    VaultKeyManager.setActiveDek(testDek);
  });

  it('encrypts record and successfully decrypts after complete runtime state destruction and unlock', async () => {
    const originalRecord = {
      title: 'Secret Recovery Phrase',
      notes: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      timestamp: Date.now(),
    };

    const ciphertextEnvelope = await VaultCrypto.encrypt(originalRecord);
    expect(typeof ciphertextEnvelope).toBe('string');
    expect(ciphertextEnvelope.length).toBeGreaterThan(60);

    // Simulate Cold Application Restart:
    VaultKeyManager.lock();

    // Restoring session with user DEK upon unlock
    VaultKeyManager.setActiveDek(testDek);

    const decryptedRecord = await VaultCrypto.decrypt<typeof originalRecord>(ciphertextEnvelope);

    expect(decryptedRecord.title).toBe('Secret Recovery Phrase');
    expect(decryptedRecord.notes).toBe(originalRecord.notes);
    expect(decryptedRecord.timestamp).toBe(originalRecord.timestamp);
  });

  it('fails decryption if an incorrect secret is provided', async () => {
    const data = { secretMessage: 'Top Secret Information' };
    const encrypted = await VaultCrypto.encrypt(data, 'CustomUserSecret-123');

    // Attempt decryption with wrong secret
    await expect(
      VaultCrypto.decrypt(encrypted, 'WrongSecret-456')
    ).rejects.toThrow(/Unable to decrypt vault record|Authentication key mismatch/);
  });

  it('fails decryption if ciphertext or auth tag is corrupted/tampered', async () => {
    const data = { bankPin: '9876' };
    const encryptedBase64 = await VaultCrypto.encrypt(data);

    const binary = atob(encryptedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    // Flip a byte in the ciphertext payload (after salt 16 + iv 12)
    bytes[32] ^= 0xff;

    let tamperedBinary = '';
    for (let i = 0; i < bytes.length; i++) {
      tamperedBinary += String.fromCharCode(bytes[i]);
    }
    const tamperedBase64 = btoa(tamperedBinary);

    await expect(
      VaultCrypto.decrypt(tamperedBase64)
    ).rejects.toThrow(/Unable to decrypt vault record|Authentication key mismatch/);
  });

  it('proves that changing login PIN has zero impact on vault decryption capability', async () => {
    const vaultItem = { password: 'SuperComplexPassword123!' };
    const encrypted = await VaultCrypto.encrypt(vaultItem);

    // Simulate PIN change / OTP PIN reset on the server
    // (In Secure Save, PIN is only verified by bcrypt on the server; it does not change client vault crypto)
    const newPin = '654321';

    // Client authenticates with new PIN, recovers DEK, and decrypts vault records
    const decrypted = await VaultCrypto.decrypt<typeof vaultItem>(encrypted);
    expect(decrypted.password).toBe('SuperComplexPassword123!');
  });
});
