import { Notification } from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    return successResponse(res, notifications, 'Notifications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return errorResponse(res, 'Notification not found', 'NOT_FOUND', 404);
    }
    notification.isRead = true;
    await notification.save();
    return successResponse(res, notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};
