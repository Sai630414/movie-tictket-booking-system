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

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    if (name !== undefined) user.name = name;
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
