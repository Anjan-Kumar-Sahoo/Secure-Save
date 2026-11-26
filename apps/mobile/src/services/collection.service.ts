import api from './api';
import { VaultCrypto } from '../utils/vaultCrypto';
import {
  ApiResponse,
  CollectionRecord,
  CollectionItemRecord,
  DecryptedCollectionItemData,
} from '@secure-save/shared-types';

export const collectionService = {
  async getCollections(): Promise<CollectionRecord[]> {
    const res = await api.get<ApiResponse<{ collections: CollectionRecord[] }>>('/collections');
    return res.data?.data?.collections || [];
  },

  async createCollection(title: string, description?: string): Promise<ApiResponse<CollectionRecord>> {
    const res = await api.post<ApiResponse<CollectionRecord>>('/collections', {
      title: title.trim(),
      description: description?.trim(),
    });
    return res.data;
  },

  async updateCollection(id: string, title: string, description?: string): Promise<ApiResponse> {
    const res = await api.put<ApiResponse>(`/collections/${id}`, {
      title: title.trim(),
      description: description?.trim(),
    });
    return res.data;
  },

  async deleteCollection(id: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/collections/${id}`);
    return res.data;
  },

  async getCollectionItems(collectionId: string): Promise<CollectionItemRecord[]> {
    const res = await api.get<ApiResponse<{ items: CollectionItemRecord[] }>>(`/collections/${collectionId}/items`);
    const rawItems: CollectionItemRecord[] = res.data?.data?.items || [];

    return Promise.all(
      rawItems.map(async (item) => {
        try {
          const decrypted = await VaultCrypto.decrypt<DecryptedCollectionItemData>(item.encryptedPayload);
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
      encryptionVersion: '1',
    });
    return res.data;
  },

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
      encryptionVersion: '1',
    });
    return res.data;
  },

  async deleteCollectionItem(collectionId: string, itemId: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/collections/${collectionId}/items/${itemId}`);
    return res.data;
  },
};
