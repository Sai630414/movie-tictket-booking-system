import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Global Error Handler]:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, messages.join(', '), 'VALIDATION_ERROR', 400, err.errors);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return errorResponse(res, `Duplicate entry for field: ${field}`, 'DUPLICATE_KEY_ERROR', 409);
  }

  // Zod Error
  if (err.name === 'ZodError') {
    const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    return errorResponse(res, issues.join('; '), 'VALIDATION_ERROR', 422, err.issues);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  return errorResponse(res, message, errorCode, statusCode);
};
