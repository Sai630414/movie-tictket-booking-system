import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 'UNAUTHORIZED', 401);
    }
    return successResponse(res, req.user, 'Current user retrieved successfully');
  } catch (err) {
    next(err);
  }
};
