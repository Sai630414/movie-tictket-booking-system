import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Event } from '../models/Event.js';
import { Venue } from '../models/Venue.js';
import { Booking } from '../models/Booking.js';
import { Show } from '../models/Show.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments({ status: 'ACTIVE' });
    const totalEvents = await Event.countDocuments({ status: 'ACTIVE' });
    const totalVenues = await Venue.countDocuments({ status: 'ACTIVE' });
    const totalBookings = await Booking.countDocuments();

    const revenueResult = await Booking.aggregate([
      { $match: { bookingStatus: 'CONFIRMED', paymentStatus: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const now = new Date();
    const upcomingShows = await Show.find({ status: 'ACTIVE', showDate: { $gte: now } })
      .populate('movie venue screen')
      .sort({ showDate: 1 })
      .limit(5);

    const upcomingEvents = await Event.find({ status: 'ACTIVE', date: { $gte: now } })
      .populate('venue')
      .sort({ date: 1 })
      .limit(5);

    return successResponse(
      res,
      {
        totalUsers,
        totalMovies,
        totalEvents,
        totalVenues,
        totalBookings,
        totalRevenue,
        upcomingShows,
        upcomingEvents,
      },
      'Admin dashboard statistics retrieved'
    );
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await User.countDocuments(query);

    return successResponse(
      res,
      {
        users,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
      'Users list retrieved'
    );
  } catch (err) {
    next(err);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const { search, bookingStatus, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (bookingStatus) query.bookingStatus = bookingStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(query)
      .populate('user movie event venue show')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    return successResponse(
      res,
      {
        bookings,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
      'Bookings list retrieved'
    );
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return errorResponse(res, 'Invalid role. Must be "user" or "admin"', 'BAD_REQUEST', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    user.role = role;
    await user.save();

    return successResponse(res, user, `User role updated to ${role}`);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bookingStatus, paymentStatus } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    return successResponse(res, booking, 'Booking status updated successfully');
  } catch (err) {
    next(err);
  }
};
