import { Request, Response } from 'express';
import { BankDetail } from '../models/bank-model';
import { Card } from '../cards/models/card-model';
import { asyncHandler } from '../../utils/error-handler';
import { createError } from '../../utils/error-handler';

const getBanks = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const banks = await BankDetail.find({ userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: 'Banks retrieved successfully',
    data: { banks }
  });
});

const createBank = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { title, encryptedPayload, encryptionVersion } = req.body;

  const bank = await BankDetail.create({
    userId,
    encryptedPayload,
    encryptionVersion
  });

  res.json({
    success: true,
    message: 'Bank created successfully',
    data: { bank }
  });
});

const getBank = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const bank = await BankDetail.findOne({ _id: id, userId });
  if (!bank) {
    throw createError(new Error('Bank not found'), 'GetBank');
  }

  res.json({
    success: true,
    message: 'Bank retrieved successfully',
    data: { bank }
  });
});

const updateBank = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { encryptedPayload, encryptionVersion } = req.body;

  const bank = await BankDetail.findOneAndUpdate(
    { _id: id, userId },
    { encryptedPayload, encryptionVersion, updatedAt: new Date() },
    { new: true }
  );

  if (!bank) {
    throw createError(new Error('Bank not found'), 'UpdateBank');
  }

  res.json({
    success: true,
    message: 'Bank updated successfully',
    data: { bank }
  });
});

const deleteBank = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const bank = await BankDetail.findOneAndDelete({ _id: id, userId });
  if (!bank) {
    throw createError(new Error('Bank not found'), 'DeleteBank');
  }

  res.json({
    success: true,
    message: 'Bank deleted successfully'
  });
});

const linkCard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { cardId } = req.body;

  const bank = await BankDetail.findOne({ _id: id, userId });
  if (!bank) {
    throw createError(new Error('Bank not found'), 'LinkCard');
  }

  const card = await Card.findOne({ _id: cardId, userId });
  if (!card) {
    throw createError(new Error('Card not found'), 'LinkCard');
  }

  if (!bank.linkedCardIds.includes(cardId)) {
    await BankDetail.findByIdAndUpdate(id, {
      $push: { linkedCardIds: cardId }
    });
  }

  res.json({
    success: true,
    message: 'Card linked to bank successfully'
  });
});

const unlinkCard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id, cardId } = req.params;

  const bank = await BankDetail.findOne({ _id: id, userId });
  if (!bank) {
    throw createError(new Error('Bank not found'), 'UnlinkCard');
  }

  await BankDetail.findByIdAndUpdate(id, {
    $pull: { linkedCardIds: cardId }
  });

  res.json({
    success: true,
    message: 'Card unlinked from bank successfully'
  });
});

export { getBanks, createBank, getBank, updateBank, deleteBank, linkCard, unlinkCard };