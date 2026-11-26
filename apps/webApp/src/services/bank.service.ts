import api from './api';
import { VaultCrypto } from '../utils/vaultCrypto';
import {
  ApiResponse,
  BankRecord,
  DecryptedBankData,
} from '@secure-save/shared-types';

export const bankService = {
  /**
   * Fetch and decrypt all bank accounts
   */
  async getAll(): Promise<BankRecord[]> {
    const res = await api.get<ApiResponse<{ bankDetails: BankRecord[] }>>('/banks');
    const rawBanks: BankRecord[] = res.data?.data?.bankDetails || [];

    return Promise.all(
      rawBanks.map(async (item) => {
        try {
          const decrypted = await VaultCrypto.decrypt<DecryptedBankData>(item.encryptedPayload);
          return { ...item, decrypted };
        } catch (err) {
          console.error('Failed to decrypt bank account:', item._id, err);
          return {
            ...item,
            decrypted: {
              bankName: 'Encrypted Account',
              accountHolderName: '••••••••',
              accountNumber: '••••••••••••',
            },
          };
        }
      })
    );
  },

  /**
   * Encrypt and create a new bank account item
   */
  async create(data: DecryptedBankData, linkedCardIds: string[] = []): Promise<ApiResponse> {
    const encryptedPayload = await VaultCrypto.encrypt({
      bankName: data.bankName.trim(),
      accountHolderName: data.accountHolderName.trim(),
      accountNumber: data.accountNumber.trim(),
      ifscCode: (data.ifscCode || '').trim().toUpperCase(),
      routingNumber: (data.routingNumber || '').trim(),
      swiftBic: (data.swiftBic || '').trim().toUpperCase(),
      accountType: data.accountType || 'checking',
      notes: (data.notes || '').trim(),
    });

    const res = await api.post<ApiResponse>('/banks', {
      encryptedPayload,
      linkedCardIds,
      encryptionVersion: '1',
    });
    return res.data;
  },

  /**
   * Encrypt and update an existing bank account item
   */
  async update(id: string, data: DecryptedBankData, linkedCardIds: string[] = []): Promise<ApiResponse> {
    const encryptedPayload = await VaultCrypto.encrypt({
      bankName: data.bankName.trim(),
      accountHolderName: data.accountHolderName.trim(),
      accountNumber: data.accountNumber.trim(),
      ifscCode: (data.ifscCode || '').trim().toUpperCase(),
      routingNumber: (data.routingNumber || '').trim(),
      swiftBic: (data.swiftBic || '').trim().toUpperCase(),
      accountType: data.accountType || 'checking',
      notes: (data.notes || '').trim(),
    });

    const res = await api.put<ApiResponse>(`/banks/${id}`, {
      encryptedPayload,
      linkedCardIds,
      encryptionVersion: '1',
    });
    return res.data;
  },

  /**
   * Delete a bank account item
   */
  async delete(id: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/banks/${id}`);
    return res.data;
  },
};
