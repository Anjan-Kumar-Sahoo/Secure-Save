import { describe, it, expect, beforeEach } from 'vitest';
import { VaultCrypto, VaultKeyManager } from '../src/utils/vaultCrypto';

describe('Card Cryptographic Serialization & Deserialization Compatibility', () => {
  const testDek = VaultKeyManager.generateRandomDek();

  beforeEach(() => {
    VaultKeyManager.setActiveDek(testDek);
  });

  it('correctly encrypts and decrypts single card with cardholderName and expiry format', async () => {
    const originalCard = {
      cardholderName: 'Alice Johnson',
      cardHolderName: 'Alice Johnson',
      cardNumber: '4111111111111111',
      expiry: '12/28',
      expiryMonth: '12',
      expiryYear: '28',
      cvv: '123',
      cardType: 'Visa',
      notes: 'Primary debit card',
    };

    const encrypted = await VaultCrypto.encrypt(originalCard);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(50);

    const decrypted = await VaultCrypto.decrypt<any>(encrypted);
    expect(decrypted.cardholderName).toBe('Alice Johnson');
    expect(decrypted.cardHolderName).toBe('Alice Johnson');
    expect(decrypted.cardNumber).toBe('4111111111111111');
    expect(decrypted.expiry).toBe('12/28');
    expect(decrypted.cvv).toBe('123');
  });

  it('correctly handles legacy cards stored with cardHolderName and separate expiryMonth/Year', async () => {
    const legacyKey = VaultKeyManager.getLegacyKeyForMigration();
    // Legacy payload encrypted with legacy key
    const legacyCard = {
      cardHolderName: 'Bob Smith',
      cardNumber: '5500000000000004',
      expiryMonth: '05',
      expiryYear: '30',
      cvv: '999',
      cardType: 'Mastercard',
    };

    const encrypted = await VaultCrypto.encrypt(legacyCard, legacyKey);
    const decrypted = await VaultCrypto.decrypt<any>(encrypted, legacyKey);

    const cardholderName = decrypted.cardholderName || decrypted.cardHolderName || '';
    const expiry = decrypted.expiry || (decrypted.expiryMonth ? `${decrypted.expiryMonth}/${decrypted.expiryYear}` : '');

    expect(cardholderName).toBe('Bob Smith');
    expect(expiry).toBe('05/30');
    expect(decrypted.cvv).toBe('999');
  });

  it('preserves field integrity with optional fields omitted', async () => {
    const minimalCard = {
      cardholderName: 'Charlie',
      cardNumber: '378282246310005',
      expiry: '10/26',
      cvv: '4567',
      cardType: 'Amex',
    };

    const encrypted = await VaultCrypto.encrypt(minimalCard);
    const decrypted = await VaultCrypto.decrypt<any>(encrypted);

    expect(decrypted.cardholderName).toBe('Charlie');
    expect(decrypted.expiry).toBe('10/26');
    expect(decrypted.notes).toBeUndefined();
  });
});
