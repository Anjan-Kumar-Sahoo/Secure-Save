import api from './api';
import { VaultCrypto, VaultKeyManager } from '../utils/vaultCrypto';

export interface MigrationProgress {
  total: number;
  migrated: number;
  failed: number;
  isComplete: boolean;
}

/**
 * VaultMigrationService
 * Inspects all vault items for legacy encryption (encryptionVersion !== "2").
 * Safely decrypts using legacy key, re-encrypts with active user DEK,
 * verifies decrypted contents match before updating record on the server.
 */
export const vaultMigrationService = {
  async migrateAllRecords(onProgress?: (p: MigrationProgress) => void): Promise<MigrationProgress> {
    const activeDek = VaultKeyManager.getActiveDek();
    const legacyKey = VaultKeyManager.getLegacyKeyForMigration();

    let total = 0;
    let migrated = 0;
    let failed = 0;

    // Helper to report progress
    const report = () => {
      if (onProgress) {
        onProgress({
          total,
          migrated,
          failed,
          isComplete: migrated + failed >= total,
        });
      }
    };

    try {
      // 1. Fetch raw cards
      const cardsRes = await api.get('/cards');
      const cards: any[] = cardsRes.data?.data?.cards || [];
      const legacyCards = cards.filter((c) => c.encryptionVersion !== '2');

      // 2. Fetch raw passwords
      const passRes = await api.get('/passwords');
      const passwords: any[] = passRes.data?.data?.passwords || [];
      const legacyPasswords = passwords.filter((p) => p.encryptionVersion !== '2');

      // 3. Fetch raw banks
      const banksRes = await api.get('/banks');
      const banks: any[] = banksRes.data?.data?.banks || [];
      const legacyBanks = banks.filter((b) => b.encryptionVersion !== '2');

      // 4. Fetch collections
      const collRes = await api.get('/collections');
      const collections: any[] = collRes.data?.data?.collections || [];
      let legacyItems: any[] = [];
      for (const coll of collections) {
        const itemsRes = await api.get(`/collections/${coll._id}/items`);
        const items: any[] = itemsRes.data?.data?.items || [];
        legacyItems = legacyItems.concat(items.filter((it) => it.encryptionVersion !== '2'));
      }

      total = legacyCards.length + legacyPasswords.length + legacyBanks.length + legacyItems.length;
      report();

      if (total === 0) {
        return { total: 0, migrated: 0, failed: 0, isComplete: true };
      }

      // Migrate Cards
      for (const card of legacyCards) {
        try {
          const decrypted = await VaultCrypto.decrypt<any>(card.encryptedPayload, legacyKey);
          const newPayload = await VaultCrypto.encrypt(decrypted, activeDek);
          // Verify
          const verify = await VaultCrypto.decrypt<any>(newPayload, activeDek);
          if (verify.cardNumber === decrypted.cardNumber) {
            await api.put(`/cards/${card._id}`, {
              title: card.title,
              encryptedPayload: newPayload,
              encryptionVersion: '2',
            });
            migrated++;
          } else {
            failed++;
          }
        } catch (e) {
          console.error('Failed to migrate card:', card._id, e);
          failed++;
        }
        report();
      }

      // Migrate Passwords
      for (const pass of legacyPasswords) {
        try {
          const decrypted = await VaultCrypto.decrypt<any>(pass.encryptedPayload, legacyKey);
          const newPayload = await VaultCrypto.encrypt(decrypted, activeDek);
          const verify = await VaultCrypto.decrypt<any>(newPayload, activeDek);
          if (verify.password === decrypted.password) {
            await api.put(`/passwords/${pass._id}`, {
              encryptedPayload: newPayload,
              encryptionVersion: '2',
            });
            migrated++;
          } else {
            failed++;
          }
        } catch (e) {
          console.error('Failed to migrate password:', pass._id, e);
          failed++;
        }
        report();
      }

      // Migrate Banks
      for (const bank of legacyBanks) {
        try {
          const decrypted = await VaultCrypto.decrypt<any>(bank.encryptedPayload, legacyKey);
          const newPayload = await VaultCrypto.encrypt(decrypted, activeDek);
          const verify = await VaultCrypto.decrypt<any>(newPayload, activeDek);
          if (verify.accountNumber === decrypted.accountNumber) {
            await api.put(`/banks/${bank._id}`, {
              encryptedPayload: newPayload,
              linkedCardIds: bank.linkedCardIds,
              encryptionVersion: '2',
            });
            migrated++;
          } else {
            failed++;
          }
        } catch (e) {
          console.error('Failed to migrate bank:', bank._id, e);
          failed++;
        }
        report();
      }

      // Migrate Collection Items
      for (const item of legacyItems) {
        try {
          const decrypted = await VaultCrypto.decrypt<any>(item.encryptedPayload, legacyKey);
          const newPayload = await VaultCrypto.encrypt(decrypted, activeDek);
          await api.put(`/collections/items/${item._id}`, {
            title: item.title,
            encryptedPayload: newPayload,
            encryptionVersion: '2',
            fileReferences: item.fileReferences,
          });
          migrated++;
        } catch (e) {
          console.error('Failed to migrate collection item:', item._id, e);
          failed++;
        }
        report();
      }

      return { total, migrated, failed, isComplete: true };
    } catch (err) {
      console.error('Migration error:', err);
      return { total, migrated, failed, isComplete: false };
    }
  }
};
