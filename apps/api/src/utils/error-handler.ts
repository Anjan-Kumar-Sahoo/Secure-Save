import { AppError } from '../middleware/error-handler';

export { AppError };

export const createError = (error: Error, context?: string): AppError => {
  const appError = new AppError(error.message, 500, 'SERVER_ERROR', context);
  appError.cause = error;
  return appError;
};

export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const validationErrorHandler = (errors: any[]) => {
  const messages = errors.map(error => error.msg).join(', ');
  return new AppError(messages, 400, 'VALIDATION_ERROR', 'Validation');
};