import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL, isR2Configured } from '../config/r2.js';

export const getPresignedUploadUrl = async (fileName, fileType, folder = 'uploads') => {
  if (!isR2Configured) throw Object.assign(new Error('Image storage is not configured'), { statusCode: 503, errorCode: 'UPLOAD_UNAVAILABLE' });
  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-120);
    const fileKey = `${folder}/${Date.now()}-${safeName}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate 15-minute presigned upload URL
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

    return {
      uploadUrl,
      fileKey,
      publicUrl,
    };
  } catch (error) {
    console.error('[R2 Presigned Upload Error]:', error);
    throw Object.assign(new Error('Could not create an upload URL'), { statusCode: 502, errorCode: 'UPLOAD_FAILED' });
  }
};
