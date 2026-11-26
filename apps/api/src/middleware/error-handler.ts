import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code?: string;
  context?: string;
  cause?: Error;

  constructor(message: string, statusCode: number = 500, code?: string, context?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Maps known errors into structured AppError instances
 */
export const createError = (error: Error, context?: string): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  const appError = new AppError(error.message, 500, 'SERVER_ERROR', context);
  appError.cause = error;
  return appError;
};

/**
 * Formats validation errors from express-validator
 */
export const validationErrorHandler = (errors: any[]): AppError => {
  const messages = errors.map(error => error.msg).join(', ');
  return new AppError(messages, 400, 'VALIDATION_ERROR', 'Validation');
};

/**
 * Wraps async route handlers to pass rejections cleanly to next()
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Centralized production-ready Express error handler middleware
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Only log detailed errors in non-test environments or when debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] [${req.method} ${req.originalUrl}]`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: error.message || 'Validation error',
      code: 'VALIDATION_ERROR',
    });
  }

  // MongoDB duplicate key error (code 11000)
  if ((error.name === 'MongoError' || error.name === 'MongoServerError') && error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry detected',
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code || 'SERVER_ERROR',
      context: process.env.NODE_ENV === 'development' ? error.context : undefined,
    });
  }

  // Unhandled / Generic server error
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || 'Internal server error'),
    code: 'INTERNAL_SERVER_ERROR',
  });
};
