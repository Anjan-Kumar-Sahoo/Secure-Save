import { Response } from 'express';
import { CollectionItem } from '../models/collection-model';
import { asyncHandler, createError } from '../../../utils/error-handler';

const getCollectionItems = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { collectionId } = req.params;
  const items = await CollectionItem.find({ collectionId, userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: 'Items retrieved successfully',
    data: { items }
  });
});

const createCollectionItem = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { collectionId } = req.params;
  const { itemType, title, encryptedPayload, encryptionVersion, fileReferences } = req.body;

  const item = await CollectionItem.create({
    userId,
    collectionId,
    itemType,
    title,
    encryptedPayload,
    encryptionVersion,
    fileReferences
  });

  res.json({
    success: true,
    message: 'Item created successfully',
    data: { item }
  });
});

const getCollectionItem = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const item = await CollectionItem.findOne({ _id: id, userId });
  if (!item) {
    throw createError(new Error('Item not found'), 'GetItem');
  }

  res.json({
    success: true,
    message: 'Item retrieved successfully',
    data: { item }
  });
});

const updateCollectionItem = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { title, encryptedPayload, encryptionVersion, fileReferences } = req.body;

  const item = await CollectionItem.findOneAndUpdate(
    { _id: id, userId },
    { title, encryptedPayload, encryptionVersion, fileReferences, updatedAt: new Date() },
    { new: true }
  );

  if (!item) {
    throw createError(new Error('Item not found'), 'UpdateItem');
  }

  res.json({
    success: true,
    message: 'Item updated successfully',
    data: { item }
  });
});

const deleteCollectionItem = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const item = await CollectionItem.findOneAndDelete({ _id: id, userId });
  if (!item) {
    throw createError(new Error('Item not found'), 'DeleteItem');
  }

  // If this item referenced stored encrypted files, clean up storage and metadata
  if (item.fileReferences && item.fileReferences.length > 0) {
    try {
      const { StoredFile } = await import('../models/file-storage-model');
      const { fileStorageService } = await import('../services/file-storage-service');

      for (const fileRef of item.fileReferences) {
        const storedFile = await StoredFile.findOne({ _id: fileRef, userId });
        if (storedFile) {
          await fileStorageService.deleteFile(userId, storedFile.storageKey);
          await StoredFile.deleteOne({ _id: storedFile._id });
        }
      }
    } catch (cleanupErr) {
      console.warn('Failed to clean up associated stored files for deleted item:', cleanupErr);
    }
  }

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
});

export { getCollectionItems, createCollectionItem, getCollectionItem, updateCollectionItem, deleteCollectionItem };