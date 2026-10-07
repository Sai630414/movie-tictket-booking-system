import { User } from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, user, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, dateOfBirth, city, preferredLanguage, profileImage } = req.body;

    if ((name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 100)) ||
      (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) ||
      (city !== undefined && (typeof city !== 'string' || !city.trim() || city.length > 100)) ||
      (preferredLanguage !== undefined && (typeof preferredLanguage !== 'string' || preferredLanguage.length > 50)) ||
      (dateOfBirth !== undefined && dateOfBirth !== null && Number.isNaN(Date.parse(dateOfBirth))) ||
      (profileImage !== undefined && (typeof profileImage !== 'string' || profileImage.length > 2048 || !/^https?:\/\//i.test(profileImage)))) {
      return errorResponse(res, 'One or more profile fields are invalid', 'VALIDATION_ERROR', 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (city !== undefined) user.city = city;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();
    return successResponse(res, user, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};
