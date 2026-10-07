import { getPresignedUploadUrl } from '../services/r2Service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const generatePresignedUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder = 'images' } = req.body;

    if (!fileName || !fileType) {
      return errorResponse(res, 'fileName and fileType are required', 'BAD_REQUEST', 400);
    }

    const presignedData = await getPresignedUploadUrl(fileName, fileType, folder);
    return successResponse(res, presignedData, 'Presigned upload URL generated successfully');
  } catch (err) {
    next(err);
  }
};
