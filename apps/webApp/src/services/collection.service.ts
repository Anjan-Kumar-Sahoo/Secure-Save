import api from './api';
import { VaultCrypto, VaultKeyManager } from '../utils/vaultCrypto';
import {
  ApiResponse,
  CollectionRecord,
  CollectionItemRecord,
  DecryptedCollectionItemData,
} from '@secure-save/shared-types';

export const collectionService = {
  /**
   * Fetch all collections
   */
  async getCollections(): Promise<CollectionRecord[]> {
    const res = await api.get<ApiResponse<{ collections: CollectionRecord[] }>>('/collections');
    return res.data?.data?.collections || [];
  },

  /**
   * Create a new collection
   */
  async createCollection(title: string, description?: string): Promise<ApiResponse<CollectionRecord>> {
    const res = await api.post<ApiResponse<CollectionRecord>>('/collections', {
      title: title.trim(),
      description: description?.trim(),
    });
    return res.data;
  },

  /**
   * Update a collection
   */
  async updateCollection(id: string, title: string, description?: string): Promise<ApiResponse> {
    const res = await api.put<ApiResponse>(`/collections/${id}`, {
      title: title.trim(),
      description: description?.trim(),
    });
    return res.data;
  },

  /**
   * Delete a collection and its items
   */
  async deleteCollection(id: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/collections/${id}`);
    return res.data;
  },

  /**
   * Fetch and decrypt items within a collection
   */
  async getCollectionItems(collectionId: string): Promise<CollectionItemRecord[]> {
    const res = await api.get<ApiResponse<{ items: CollectionItemRecord[] }>>(`/collections/${collectionId}/items`);
    const rawItems: CollectionItemRecord[] = res.data?.data?.items || [];

    return Promise.all(
      rawItems.map(async (item) => {
        try {
          const customKey = item.encryptionVersion === '2' ? undefined : VaultKeyManager.getLegacyKeyForMigration();
          const decrypted = await VaultCrypto.decrypt<DecryptedCollectionItemData>(item.encryptedPayload, customKey);
          return { ...item, decrypted };
        } catch (err) {
          console.error('Failed to decrypt collection item:', item._id, err);
          return {
            ...item,
            decrypted: {
              title: item.title || 'Encrypted Item',
              content: '••••••••••••',
            },
          };
        }
      })
    );
  },

  /**
   * Encrypt and add an item to a collection
   */
  async createCollectionItem(
    collectionId: string,
    title: string,
    itemType: string,
    decryptedData: DecryptedCollectionItemData
  ): Promise<ApiResponse> {
    const encryptedPayload = await VaultCrypto.encrypt(decryptedData);

    const res = await api.post<ApiResponse>(`/collections/${collectionId}/items`, {
      title: title.trim(),
      itemType,
      encryptedPayload,
      encryptionVersion: '2',
    });
    return res.data;
  },

  /**
   * Encrypt and update a collection item
   */
  async updateCollectionItem(
    collectionId: string,
    itemId: string,
    title: string,
    itemType: string,
    decryptedData: DecryptedCollectionItemData
  ): Promise<ApiResponse> {
    const encryptedPayload = await VaultCrypto.encrypt(decryptedData);

    const res = await api.put<ApiResponse>(`/collections/${collectionId}/items/${itemId}`, {
      title: title.trim(),
      itemType,
      encryptedPayload,
      encryptionVersion: '2',
    });
    return res.data;
  },

  /**
   * Delete an item from a collection
   */
  async deleteCollectionItem(collectionId: string, itemId: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/collections/items/${itemId}`);
    return res.data;
  },

  /**
   * Upload encrypted file attachment to vault storage
   */
  async uploadFile(fileName: string, mimeType: string, encryptedBase64: string): Promise<{ fileId: string; storageKey: string; sizeBytes: number }> {
    const res = await api.post<ApiResponse<{ fileId: string; storageKey: string; sizeBytes: number }>>('/collections/files/upload', {
      fileName,
      mimeType,
      encryptedBase64,
    });
    if (!res.data?.data) throw new Error(res.data?.message || 'File upload failed');
    return res.data.data;
  },

  /**
   * Download encrypted file attachment from vault storage
   */
  async downloadFile(fileId: string): Promise<{ fileName: string; mimeType: string; sizeBytes: number; encryptedBase64: string }> {
    const res = await api.get<ApiResponse<{ fileName: string; mimeType: string; sizeBytes: number; encryptedBase64: string }>>(`/collections/files/${fileId}/download`);
    if (!res.data?.data) throw new Error(res.data?.message || 'File download failed');
    return res.data.data;
  },
};
