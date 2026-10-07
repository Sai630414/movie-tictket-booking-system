import { getRecommendedContent } from '../services/recommendationService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const data = await getRecommendedContent(req.user);
    return successResponse(res, data, 'Recommendations retrieved successfully');
  } catch (err) {
    next(err);
  }
};
