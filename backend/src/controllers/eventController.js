import { Event } from '../models/Event.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import slugify from 'slugify';
import { escapeRegex } from '../utils/search.js';

export const getEvents = async (req, res, next) => {
  try {
    const {
      search,
      category,
      city,
      date,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: 'ACTIVE' };

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } },
        { organizer: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (city) {
      query.city = { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') };
    }

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (minPrice || maxPrice) {
      query['ticketCategories.price'] = {};
      if (minPrice) query['ticketCategories.price'].$gte = Number(minPrice);
      if (maxPrice) query['ticketCategories.price'].$lte = Number(maxPrice);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const events = await Event.find(query)
      .populate('venue')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments(query);

    return successResponse(
      res,
      {
        events,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Events retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getTrendingEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ status: 'ACTIVE' })
      .populate('venue')
      .sort({ date: 1 })
      .limit(10);
    return successResponse(res, events, 'Trending events retrieved');
  } catch (err) {
    next(err);
  }
};

export const getNearbyEvents = async (req, res, next) => {
  try {
    const { city = 'Vijayawada' } = req.query;
    const events = await Event.find({
      status: 'ACTIVE',
      city: { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') },
    })
      .populate('venue')
      .sort({ date: 1 })
      .limit(10);

    return successResponse(res, events, `Nearby events in ${city} retrieved`);
  } catch (err) {
    next(err);
  }
};

export const getEventBySlug = async (req, res, next) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug }).populate('venue');
    if (!event) {
      return errorResponse(res, 'Event not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, event, 'Event details retrieved');
  } catch (err) {
    next(err);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('venue');
    if (!event) {
      return errorResponse(res, 'Event not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, event, 'Event details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const slug = slugify(req.body.name, { lower: true, strict: true }) + '-' + Date.now();
    const event = await Event.create({
      ...req.body,
      slug,
    });
    return successResponse(res, event, 'Event created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return errorResponse(res, 'Event not found', 'NOT_FOUND', 404);
    }

    if (req.body.name && req.body.name !== event.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true }) + '-' + Date.now();
    }

    Object.assign(event, req.body);
    await event.save();

    return successResponse(res, event, 'Event updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return errorResponse(res, 'Event not found', 'NOT_FOUND', 404);
    }

    event.status = 'INACTIVE';
    await event.save();

    return successResponse(res, null, 'Event deactivated successfully');
  } catch (err) {
    next(err);
  }
};
