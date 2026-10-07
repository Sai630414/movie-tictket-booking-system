import { getPresignedUploadUrl } from '../services/r2Service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const generatePresignedUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder = 'images' } = req.body;

    if (typeof fileName !== 'string' || fileName.length > 180 || !/\.(png|jpe?g|webp)$/i.test(fileName) ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(fileType) ||
      !['movies', 'events', 'venues'].includes(folder)) {
      return errorResponse(res, 'Provide a supported image filename, image MIME type, and upload folder', 'BAD_REQUEST', 400);
    }

    const presignedData = await getPresignedUploadUrl(fileName, fileType, folder);
    return successResponse(res, presignedData, 'Presigned upload URL generated successfully');
  } catch (err) {
    next(err);
  }
};
