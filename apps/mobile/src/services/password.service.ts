import api from './api';
import { VaultCrypto, VaultKeyManager } from '../utils/vaultCrypto';
import {
  ApiResponse,
  PasswordRecord,
  DecryptedPasswordData,
} from '@secure-save/shared-types';

export const passwordService = {
  async getAll(): Promise<PasswordRecord[]> {
    const res = await api.get<ApiResponse<{ passwords: PasswordRecord[] }>>('/passwords');
    const rawPasswords: PasswordRecord[] = res.data?.data?.passwords || [];

    return Promise.all(
      rawPasswords.map(async (item) => {
        try {
          const customKey = item.encryptionVersion === '2' ? undefined : VaultKeyManager.getLegacyKeyForMigration();
          const decrypted = await VaultCrypto.decrypt<DecryptedPasswordData>(item.encryptedPayload, customKey);
          return { ...item, decrypted };
        } catch (err) {
          console.error('Failed to decrypt password:', item._id, err);
          return {
            ...item,
            decrypted: {
              title: 'Encrypted Entry',
              password: '••••••••••••',
            },
          };
        }
      })
    );
  },

  async create(data: DecryptedPasswordData): Promise<ApiResponse> {
    const encryptedPayload = await VaultCrypto.encrypt({
      title: data.title.trim(),
      username: (data.username || '').trim(),
      email: (data.email || '').trim(),
      password: data.password,
      websiteUrl: (data.websiteUrl || '').trim(),
      notes: (data.notes || '').trim(),
    });

    const res = await api.post<ApiResponse>('/passwords', {
      encryptedPayload,
      encryptionVersion: '2',
    });
    return res.data;
  },

  async update(id: string, data: DecryptedPasswordData): Promise<ApiResponse> {
    const encryptedPayload = await VaultCrypto.encrypt({
      title: data.title.trim(),
      username: (data.username || '').trim(),
      email: (data.email || '').trim(),
      password: data.password,
      websiteUrl: (data.websiteUrl || '').trim(),
      notes: (data.notes || '').trim(),
    });

    const res = await api.put<ApiResponse>(`/passwords/${id}`, {
      encryptedPayload,
      encryptionVersion: '2',
    });
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/passwords/${id}`);
    return res.data;
  },
};
