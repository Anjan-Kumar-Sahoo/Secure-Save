import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code?: string;
  context?: string;

  constructor(message: string, statusCode: number = 500, code?: string, context?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
  }
}

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR'
    });
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code || 'SERVER_ERROR'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

export const createError = (error: Error, context?: string): AppError => {
  const appError = new AppError(error.message, 500, 'SERVER_ERROR', context);
  appError.cause = error;
  return appError;
};