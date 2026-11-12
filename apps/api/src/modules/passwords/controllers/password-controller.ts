import { Response } from 'express';
import { PasswordEntry } from '../models/password-model';
import { asyncHandler, createError } from '../../utils/error-handler';

const getPasswords = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const passwords = await PasswordEntry.find({ userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: 'Passwords retrieved successfully',
    data: { passwords }
  });
});

const createPassword = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { encryptedPayload, encryptionVersion } = req.body;

  const password = await PasswordEntry.create({
    userId,
    encryptedPayload,
    encryptionVersion
  });

  res.json({
    success: true,
    message: 'Password created successfully',
    data: { password }
  });
});

const getPassword = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const password = await PasswordEntry.findOne({ _id: id, userId });
  if (!password) {
    throw createError(new Error('Password not found'), 'GetPassword');
  }

  res.json({
    success: true,
    message: 'Password retrieved successfully',
    data: { password }
  });
});

const updatePassword = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { encryptedPayload, encryptionVersion } = req.body;

  const password = await PasswordEntry.findOneAndUpdate(
    { _id: id, userId },
    { encryptedPayload, encryptionVersion, updatedAt: new Date() },
    { new: true }
  );

  if (!password) {
    throw createError(new Error('Password not found'), 'UpdatePassword');
  }

  res.json({
    success: true,
    message: 'Password updated successfully',
    data: { password }
  });
});

const deletePassword = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const password = await PasswordEntry.findOneAndDelete({ _id: id, userId });
  if (!password) {
    throw createError(new Error('Password not found'), 'DeletePassword');
  }

  res.json({
    success: true,
    message: 'Password deleted successfully'
  });
});

export { getPasswords, createPassword, getPassword, updatePassword, deletePassword };