import { Venue } from '../models/Venue.js';
import { Screen } from '../models/Screen.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getVenues = async (req, res, next) => {
  try {
    const { city, type, search } = req.query;
    const query = { status: 'ACTIVE' };

    if (city) {
      query.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const venues = await Venue.find(query).sort({ name: 1 });
    return successResponse(res, venues, 'Venues retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getVenueById = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return errorResponse(res, 'Venue not found', 'NOT_FOUND', 404);
    }
    const screens = await Screen.find({ venue: venue._id });
    return successResponse(res, { venue, screens }, 'Venue details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createVenue = async (req, res, next) => {
  try {
    const venue = await Venue.create(req.body);
    return successResponse(res, venue, 'Venue created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!venue) {
      return errorResponse(res, 'Venue not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, venue, 'Venue updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return errorResponse(res, 'Venue not found', 'NOT_FOUND', 404);
    }
    venue.status = 'INACTIVE';
    await venue.save();
    return successResponse(res, null, 'Venue deactivated successfully');
  } catch (err) {
    next(err);
  }
};

export const addScreenToVenue = async (req, res, next) => {
  try {
    const { id: venueId } = req.params;
    const { name, rows = 8, columns = 12 } = req.body;

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return errorResponse(res, 'Venue not found', 'NOT_FOUND', 404);
    }

    // Generate seat layout automatically A1, A2... B1, B2...
    const seatLayout = [];
    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

    for (let r = 0; r < rows; r++) {
      const rowChar = rowLetters[r] || `R${r + 1}`;
      let seatType = 'REGULAR';
      let priceMultiplier = 1.0;

      if (r >= rows - 2) {
        seatType = 'RECLINER';
        priceMultiplier = 1.6;
      } else if (r >= rows - 4) {
        seatType = 'VIP';
        priceMultiplier = 1.3;
      } else if (r >= Math.floor(rows / 2)) {
        seatType = 'PREMIUM';
        priceMultiplier = 1.15;
      }

      for (let c = 1; c <= columns; c++) {
        seatLayout.push({
          row: rowChar,
          number: c,
          seatType,
          priceMultiplier,
          status: 'ACTIVE',
        });
      }
    }

    const screen = await Screen.create({
      venue: venueId,
      name,
      rows,
      columns,
      totalSeats: rows * columns,
      seatLayout,
    });

    return successResponse(res, screen, 'Screen created successfully', 201);
  } catch (err) {
    next(err);
  }
};
