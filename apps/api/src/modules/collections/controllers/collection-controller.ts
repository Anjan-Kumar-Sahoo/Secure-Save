import { Response } from 'express';
import { Collection, CollectionItem } from '../models/collection-model';
import { asyncHandler, createError } from '../../utils/error-handler';

const getCollections = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const collections = await Collection.find({ userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: 'Collections retrieved successfully',
    data: { collections }
  });
});

const createCollection = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { title, description } = req.body;

  const collection = await Collection.create({
    userId,
    title,
    description
  });

  res.json({
    success: true,
    message: 'Collection created successfully',
    data: { collection }
  });
});

const getCollection = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const collection = await Collection.findOne({ _id: id, userId });
  if (!collection) {
    throw createError(new Error('Collection not found'), 'GetCollection');
  }

  res.json({
    success: true,
    message: 'Collection retrieved successfully',
    data: { collection }
  });
});

const updateCollection = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { title, description } = req.body;

  const collection = await Collection.findOneAndUpdate(
    { _id: id, userId },
    { title, description, updatedAt: new Date() },
    { new: true }
  );

  if (!collection) {
    throw createError(new Error('Collection not found'), 'UpdateCollection');
  }

  res.json({
    success: true,
    message: 'Collection updated successfully',
    data: { collection }
  });
});

const deleteCollection = asyncHandler(async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  const collection = await Collection.findOneAndDelete({ _id: id, userId });
  if (!collection) {
    throw createError(new Error('Collection not found'), 'DeleteCollection');
  }

  // Optional: Delete items in collection or just let them stay (orphan handling depends on policy)
  await CollectionItem.deleteMany({ collectionId: id, userId });

  res.json({
    success: true,
    message: 'Collection and its items deleted successfully'
  });
});

export { getCollections, createCollection, getCollection, updateCollection, deleteCollection };