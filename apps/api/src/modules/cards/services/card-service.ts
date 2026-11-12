import { Card } from '../models/card-model';
import { User } from '../auth/models/user-model';

class CardService {
  static async createCard(userId: string, cardData: any): Promise<any> {
    const card = await Card.create({
      userId,
      title: cardData.title,
      encryptedPayload: cardData.encryptedPayload,
      encryptionVersion: cardData.encryptionVersion,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return card;
  }

  static async getCards(userId: string): Promise<any[]> {
    return await Card.find({ userId }).sort({ createdAt: -1 });
  }

  static async getCard(userId: string, cardId: string): Promise<any> {
    const card = await Card.findOne({ _id: cardId, userId });
    if (!card) throw new Error('Card not found');
    return card;
  }

  static async updateCard(userId: string, cardId: string, cardData: any): Promise<any> {
    const card = await Card.findOneAndUpdate(
      { _id: cardId, userId },
      {
        title: cardData.title,
        encryptedPayload: cardData.encryptedPayload,
        encryptionVersion: cardData.encryptionVersion,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!card) throw new Error('Card not found');
    return card;
  }

  static async deleteCard(userId: string, cardId: string): Promise<void> {
    const result = await Card.findOneAndDelete({ _id: cardId, userId });
    if (!result) throw new Error('Card not found');
  }
}

export { CardService };