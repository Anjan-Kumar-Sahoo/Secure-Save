import api from './api';
import { VaultCrypto } from '../utils/vaultCrypto';
import {
  ApiResponse,
  CardRecord,
  DecryptedCardData,
} from '@secure-save/shared-types';

export const cardService = {
  async getAll(): Promise<CardRecord[]> {
    const res = await api.get<ApiResponse<{ cards: CardRecord[] }>>('/cards');
    const rawCards: CardRecord[] = res.data?.data?.cards || [];

    return Promise.all(
      rawCards.map(async (item) => {
        try {
          const decrypted = await VaultCrypto.decrypt<DecryptedCardData>(item.encryptedPayload);
          return { ...item, decrypted };
        } catch (err) {
          console.error('Failed to decrypt card:', item._id, err);
          return {
            ...item,
            decrypted: {
              cardHolderName: 'Encrypted Card',
              cardNumber: '•••• •••• •••• ••••',
              cardType: 'Card',
              expiryMonth: '••',
              expiryYear: '••',
              cvv: '•••',
            },
          };
        }
      })
    );
  },

  async create(title: string, data: any): Promise<ApiResponse> {
    const cardHolderName = (data.cardHolderName || data.cardholderName || '').trim();
    const expiry = (data.expiry || '').trim();
    let expiryMonth = data.expiryMonth || '';
    let expiryYear = data.expiryYear || '';
    if (expiry && expiry.includes('/')) {
      const parts = expiry.split('/');
      expiryMonth = parts[0]?.trim() || '';
      expiryYear = parts[1]?.trim() || '';
    }

    const encryptedPayload = await VaultCrypto.encrypt({
      cardHolderName,
      cardholderName: cardHolderName,
      cardNumber: (data.cardNumber || '').replace(/\s+/g, ''),
      cardType: data.cardType || 'Visa',
      expiry: expiry || (expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : ''),
      expiryMonth,
      expiryYear,
      cvv: data.cvv || '',
      bankName: (data.bankName || '').trim(),
      nickname: (data.nickname || '').trim(),
      notes: (data.notes || '').trim(),
    });

    const res = await api.post<ApiResponse>('/cards', {
      title: title.trim(),
      encryptedPayload,
      encryptionVersion: '1',
    });
    return res.data;
  },

  async update(id: string, title: string, data: any): Promise<ApiResponse> {
    const cardHolderName = (data.cardHolderName || data.cardholderName || '').trim();
    const expiry = (data.expiry || '').trim();
    let expiryMonth = data.expiryMonth || '';
    let expiryYear = data.expiryYear || '';
    if (expiry && expiry.includes('/')) {
      const parts = expiry.split('/');
      expiryMonth = parts[0]?.trim() || '';
      expiryYear = parts[1]?.trim() || '';
    }

    const encryptedPayload = await VaultCrypto.encrypt({
      cardHolderName,
      cardholderName: cardHolderName,
      cardNumber: (data.cardNumber || '').replace(/\s+/g, ''),
      cardType: data.cardType || 'Visa',
      expiry: expiry || (expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : ''),
      expiryMonth,
      expiryYear,
      cvv: data.cvv || '',
      bankName: (data.bankName || '').trim(),
      nickname: (data.nickname || '').trim(),
      notes: (data.notes || '').trim(),
    });

    const res = await api.put<ApiResponse>(`/cards/${id}`, {
      title: title.trim(),
      encryptedPayload,
      encryptionVersion: '1',
    });
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/cards/${id}`);
    return res.data;
  },
};
