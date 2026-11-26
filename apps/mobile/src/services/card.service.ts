import api from './api';
import { VaultCrypto, VaultKeyManager } from '../utils/vaultCrypto';
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
          // If legacy encryptionVersion "1" (or unversioned), use legacy key; if "2", use active DEK
          const customKey = item.encryptionVersion === '2' ? undefined : VaultKeyManager.getLegacyKeyForMigration();
          const decrypted = await VaultCrypto.decrypt<any>(item.encryptedPayload, customKey);
          // Normalize both naming conventions (cardholderName vs cardHolderName, expiry vs expiryMonth/Year)
          const expiryVal = decrypted.expiry || (decrypted.expiryMonth ? `${decrypted.expiryMonth}/${decrypted.expiryYear}` : '');
          const cardholderNameVal = decrypted.cardholderName || decrypted.cardHolderName || '';
          
          return {
            ...item,
            decrypted: {
              cardholderName: cardholderNameVal,
              cardHolderName: cardholderNameVal,
              cardNumber: decrypted.cardNumber || '',
              expiry: expiryVal,
              expiryMonth: decrypted.expiryMonth || (expiryVal.includes('/') ? expiryVal.split('/')[0] : ''),
              expiryYear: decrypted.expiryYear || (expiryVal.includes('/') ? expiryVal.split('/')[1] : ''),
              cvv: decrypted.cvv || '',
              cardType: decrypted.cardType || 'General',
              bankName: decrypted.bankName,
              nickname: decrypted.nickname,
              notes: decrypted.notes,
            },
          };
        } catch (err) {
          console.error('Failed to decrypt card:', item._id, err);
          return {
            ...item,
            decrypted: {
              cardholderName: 'Encrypted Card',
              cardHolderName: 'Encrypted Card',
              cardNumber: '•••• •••• •••• ••••',
              expiry: '••/••',
              expiryMonth: '••',
              expiryYear: '••',
              cvv: '•••',
              cardType: 'Card',
            },
          };
        }
      })
    );
  },

  async create(title: string, data: any): Promise<ApiResponse> {
    const cardholderName = (data.cardholderName || data.cardHolderName || '').trim();
    const expiry = (data.expiry || (data.expiryMonth ? `${data.expiryMonth}/${data.expiryYear}` : '')).trim();

    const encryptedPayload = await VaultCrypto.encrypt({
      cardholderName,
      cardHolderName: cardholderName,
      cardNumber: (data.cardNumber || '').replace(/\s+/g, ''),
      cardType: data.cardType || 'Visa',
      expiry,
      expiryMonth: data.expiryMonth || (expiry.includes('/') ? expiry.split('/')[0] : ''),
      expiryYear: data.expiryYear || (expiry.includes('/') ? expiry.split('/')[1] : ''),
      cvv: data.cvv || '',
      bankName: (data.bankName || '').trim(),
      nickname: (data.nickname || '').trim(),
      notes: (data.notes || '').trim(),
    });

    const res = await api.post<ApiResponse>('/cards', {
      title: title.trim(),
      encryptedPayload,
      encryptionVersion: '2',
    });
    return res.data;
  },

  async update(id: string, title: string, data: any): Promise<ApiResponse> {
    const cardholderName = (data.cardholderName || data.cardHolderName || '').trim();
    const expiry = (data.expiry || (data.expiryMonth ? `${data.expiryMonth}/${data.expiryYear}` : '')).trim();

    const encryptedPayload = await VaultCrypto.encrypt({
      cardholderName,
      cardHolderName: cardholderName,
      cardNumber: (data.cardNumber || '').replace(/\s+/g, ''),
      cardType: data.cardType || 'Visa',
      expiry,
      expiryMonth: data.expiryMonth || (expiry.includes('/') ? expiry.split('/')[0] : ''),
      expiryYear: data.expiryYear || (expiry.includes('/') ? expiry.split('/')[1] : ''),
      cvv: data.cvv || '',
      bankName: (data.bankName || '').trim(),
      nickname: (data.nickname || '').trim(),
      notes: (data.notes || '').trim(),
    });

    const res = await api.put<ApiResponse>(`/cards/${id}`, {
      title: title.trim(),
      encryptedPayload,
      encryptionVersion: '2',
    });
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/cards/${id}`);
    return res.data;
  },
};
