import { describe, it, expect, beforeEach } from 'vitest';
import { VaultCrypto, VaultKeyManager, MissingEncryptionKeyError } from '../src/utils/vaultCrypto';

describe('Zero-Knowledge Per-User DEK & Master Password Lifecycle', () => {
  beforeEach(() => {
    // Clear in-memory keys
    VaultKeyManager.lock();
  });

  it('fails securely when vault is locked and no key is available', async () => {
    expect(VaultKeyManager.isUnlocked()).toBe(false);

    await expect(
      VaultCrypto.encrypt({ secretNote: 'Hello' })
    ).rejects.toThrow(MissingEncryptionKeyError);

    await expect(
      VaultCrypto.decrypt('fake-ciphertext')
    ).rejects.toThrow(MissingEncryptionKeyError);
  });

  it('proves complete user registration, DEK wrapping, cold restart, and unlock flow', async () => {
    // === 1. User Registration Flow ===
    const userMasterPassword = 'Correct-Horse-Battery-Staple-2026!';
    // Client generates raw 256-bit random DEK
    const clientGeneratedDek = VaultKeyManager.generateRandomDek();
    expect(clientGeneratedDek).toBeDefined();

    // Client wraps (encrypts) DEK using KEK derived from Master Password
    const wrappedVaultConfig = await VaultKeyManager.wrapDek(userMasterPassword, clientGeneratedDek);
    expect(wrappedVaultConfig.kekSalt).toBeDefined();
    expect(wrappedVaultConfig.wrappedDek).toBeDefined();
    expect(wrappedVaultConfig.keyVersion).toBe(2);

    // Set active DEK in memory
    VaultKeyManager.setActiveDek(clientGeneratedDek);
    expect(VaultKeyManager.isUnlocked()).toBe(true);

    // === 2. Encrypt Records with User DEK ===
    const sensitiveRecord = {
      accountNumber: '9876543210',
      balance: '$1,000,000',
      memo: 'Confidential Client Data',
    };
    const ciphertextV2 = await VaultCrypto.encrypt(sensitiveRecord);
    expect(ciphertextV2).toBeDefined();

    // === 3. Cold Application Restart Simulation ===
    // App closes, memory is completely cleared
    VaultKeyManager.lock();
    expect(VaultKeyManager.isUnlocked()).toBe(false);

    // Attempting to decrypt now MUST fail
    await expect(VaultCrypto.decrypt(ciphertextV2)).rejects.toThrow(MissingEncryptionKeyError);

    // === 4. User Unlock with Master Password ===
    // Client unwraps DEK using Master Password and the wrapped config retrieved from server
    const recoveredDek = await VaultKeyManager.unwrapDek(userMasterPassword, wrappedVaultConfig);
    expect(recoveredDek).toBe(clientGeneratedDek);

    // Set active recovered DEK in session
    VaultKeyManager.setActiveDek(recoveredDek);
    expect(VaultKeyManager.isUnlocked()).toBe(true);

    // === 5. Decrypt Record ===
    const decryptedRecord = await VaultCrypto.decrypt<typeof sensitiveRecord>(ciphertextV2);
    expect(decryptedRecord.accountNumber).toBe('9876543210');
    expect(decryptedRecord.balance).toBe('$1,000,000');
    expect(decryptedRecord.memo).toBe('Confidential Client Data');
  });

  it('rejects vault unlocking with an incorrect Master Password', async () => {
    const truePassword = 'MySecretVaultPassword#1';
    const wrongPassword = 'WrongVaultPassword#999';

    const userDek = VaultKeyManager.generateRandomDek();
    const wrappedConfig = await VaultKeyManager.wrapDek(truePassword, userDek);

    // Unwrapping with wrong Master Password must fail
    await expect(
      VaultKeyManager.unwrapDek(wrongPassword, wrappedConfig)
    ).rejects.toThrow();
  });

  it('proves two users have distinct random DEKs and cannot decrypt each other records', async () => {
    const userA_Dek = VaultKeyManager.generateRandomDek();
    const userB_Dek = VaultKeyManager.generateRandomDek();
    expect(userA_Dek).not.toBe(userB_Dek);

    // User A encrypts
    VaultKeyManager.setActiveDek(userA_Dek);
    const userA_Record = { secret: 'User A Private Token' };
    const userA_Ciphertext = await VaultCrypto.encrypt(userA_Record);

    // User B tries to decrypt User A's ciphertext
    VaultKeyManager.setActiveDek(userB_Dek);
    await expect(
      VaultCrypto.decrypt(userA_Ciphertext)
    ).rejects.toThrow(/Unable to decrypt vault record|Authentication key mismatch/);
  });

  it('proves Master Password change re-wraps DEK without re-encrypting existing vault records', async () => {
    const oldPassword = 'OldMasterPassword123';
    const newPassword = 'NewStrongMasterPassword456!';

    // Initial setup
    const userDek = VaultKeyManager.generateRandomDek();
    VaultKeyManager.setActiveDek(userDek);

    const vaultItem = { credential: 'MasterCredential' };
    const ciphertext = await VaultCrypto.encrypt(vaultItem);

    // User changes Master Password:
    // Only the DEK is re-wrapped with the new KEK!
    const updatedWrappedConfig = await VaultKeyManager.wrapDek(newPassword, userDek);

    // Simulate app restart
    VaultKeyManager.lock();

    // Old password fails to unlock
    await expect(
      VaultKeyManager.unwrapDek(oldPassword, updatedWrappedConfig)
    ).rejects.toThrow();

    // New password unlocks and decrypts original record
    const unlockedDek = await VaultKeyManager.unwrapDek(newPassword, updatedWrappedConfig);
    expect(unlockedDek).toBe(userDek);
    VaultKeyManager.setActiveDek(unlockedDek);

    const decrypted = await VaultCrypto.decrypt<typeof vaultItem>(ciphertext);
    expect(decrypted.credential).toBe('MasterCredential');
  });

  it('proves legacy v1 record migration to per-user v2 DEK', async () => {
    // 1. Create legacy v1 ciphertext using legacy migration key
    const legacyKey = VaultKeyManager.getLegacyKeyForMigration();
    const legacyItem = { username: 'legacy_admin', note: 'Created in 2025' };
    const legacyCiphertext = await VaultCrypto.encrypt(legacyItem, legacyKey);

    // 2. User has per-user DEK active
    const userDek = VaultKeyManager.generateRandomDek();
    VaultKeyManager.setActiveDek(userDek);

    // 3. Migration step: decrypt legacy using legacy key, re-encrypt using active DEK
    const decryptedLegacy = await VaultCrypto.decrypt<typeof legacyItem>(legacyCiphertext, legacyKey);
    expect(decryptedLegacy.username).toBe('legacy_admin');

    const migratedCiphertextV2 = await VaultCrypto.encrypt(decryptedLegacy); // uses userDek

    // 4. Verify migrated record decrypts using user DEK, and NOT using legacy key
    const verifiedV2 = await VaultCrypto.decrypt<typeof legacyItem>(migratedCiphertextV2);
    expect(verifiedV2.username).toBe('legacy_admin');

    // Attempting to decrypt the new v2 record with the old legacy key must fail
    await expect(
      VaultCrypto.decrypt(migratedCiphertextV2, legacyKey)
    ).rejects.toThrow(/Unable to decrypt vault record|Authentication key mismatch/);
  });

  it('supports user recovery key generation and unwrap when Master Password is unknown', async () => {
    const masterPassword = 'OriginalSecretPassword123!';
    const rawDek = VaultKeyManager.generateRandomDek();
    const recoveryKey = VaultKeyManager.generateRecoveryKey();

    expect(recoveryKey).toMatch(/^RCV(-[A-F0-9]{4}){12}$/);

    // Fast iteration count for unit test execution speed while verifying logic
    const testIterations = 5000;
    const wrappedConfig = await VaultKeyManager.wrapDekWithRecovery(
      masterPassword,
      rawDek,
      recoveryKey,
      testIterations
    );

    expect(wrappedConfig.recoveryWrappedDek).toBeDefined();
    expect(wrappedConfig.recoverySalt).toBeDefined();
    expect(wrappedConfig.iterations).toBe(testIterations);

    // Unlocking with recovery key succeeds without knowing masterPassword
    const unwrappedDek = await VaultKeyManager.unwrapDekWithRecoveryKey(recoveryKey, wrappedConfig);
    expect(unwrappedDek).toBe(rawDek);

    // Invalid recovery key fails securely
    const invalidRecoveryKey = VaultKeyManager.generateRecoveryKey();
    await expect(
      VaultKeyManager.unwrapDekWithRecoveryKey(invalidRecoveryKey, wrappedConfig)
    ).rejects.toThrow();
  });

  it('verifies Authenticated Additional Data (AAD) prevents tampering or record transposition', async () => {
    const rawDek = VaultKeyManager.generateRandomDek();
    VaultKeyManager.setActiveDek(rawDek);

    const sensitiveData = { pin: '4321', note: 'Top Secret' };
    const validAAD = { userId: 'user-101', recordId: 'card-abc', recordType: 'card', version: '2' };

    // Encrypt with AAD bound
    const ciphertext = await VaultCrypto.encrypt(sensitiveData, undefined, validAAD);

    // Decrypting with matching AAD succeeds
    const decrypted = await VaultCrypto.decrypt<typeof sensitiveData>(ciphertext, undefined, validAAD);
    expect(decrypted.pin).toBe('4321');

    // Tampered AAD (e.g. transposed into a different user or recordId) must be rejected by AES-GCM
    const tamperedAAD = { userId: 'user-999', recordId: 'card-xyz', recordType: 'card', version: '2' };
    await expect(
      VaultCrypto.decrypt(ciphertext, undefined, tamperedAAD)
    ).rejects.toThrow(/Unable to decrypt vault record|Authentication key mismatch/);

    // Decrypting without expected AAD must also fail
    await expect(
      VaultCrypto.decrypt(ciphertext)
    ).rejects.toThrow(/Unable to decrypt vault record|Authentication key mismatch/);
  });
});
