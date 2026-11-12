import { Request, Response } from 'express';
import { User } from '../../auth/models/user-model';
import { Card } from '../models/card-model';
import { asyncHandler } from '../../../utils/error-handler';
import { createError } from '../../../utils/error-handler';

const getCards = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const cards = await Card.find({ userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: 'Cards retrieved successfully',
    data: { cards }
  });
});

const createCard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { title, encryptedPayload, encryptionVersion } = req.body;

  const card = await Card.create({
    userId,
    title,
    encryptedPayload,
    encryptionVersion
  });

  res.json({
    success: true,
    message: 'Card created successfully',
    data: { card }
  });
});

const getCard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const card = await Card.findOne({ _id: id, userId });
  if (!card) {
    throw createError(new Error('Card not found'), 'GetCard');
  }

  res.json({
    success: true,
    message: 'Card retrieved successfully',
    data: { card }
  });
});

const updateCard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { title, encryptedPayload, encryptionVersion } = req.body;

  const card = await Card.findOneAndUpdate(
    { _id: id, userId },
    { title, encryptedPayload, encryptionVersion, updatedAt: new Date() },
    { new: true }
  );

  if (!card) {
    throw createError(new Error('Card not found'), 'UpdateCard');
  }

  res.json({
    success: true,
    message: 'Card updated successfully',
    data: { card }
  });
});

const deleteCard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const card = await Card.findOneAndDelete({ _id: id, userId });
  if (!card) {
    throw createError(new Error('Card not found'), 'DeleteCard');
  }

  res.json({
    success: true,
    message: 'Card deleted successfully'
  });
});

export { getCards, createCard, getCard, updateCard, deleteCard };