import { Show } from '../models/Show.js';
import { Screen } from '../models/Screen.js';
import { Movie } from '../models/Movie.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getShows = async (req, res, next) => {
  try {
    const { movieId, venueId, date, city } = req.query;
    const query = { status: 'ACTIVE' };

    if (movieId) query.movie = movieId;
    if (venueId) query.venue = venueId;

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      query.showDate = { $gte: startOfDay, $lte: endOfDay };
    }

    let shows = await Show.find(query)
      .populate('movie venue screen')
      .sort({ showDate: 1, startTime: 1 });

    if (city) {
      shows = shows.filter(
        (s) => s.venue?.city && s.venue.city.toLowerCase() === city.toLowerCase()
      );
    }

    return successResponse(res, shows, 'Shows retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id).populate('movie venue screen');
    if (!show) {
      return errorResponse(res, 'Show not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, show, 'Show details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createShow = async (req, res, next) => {
  try {
    const { movie: movieId, venue: venueId, screen: screenId, showDate, startTime, language, format = '2D', basePrice } = req.body;

    const screen = await Screen.findById(screenId);
    if (!screen) {
      return errorResponse(res, 'Screen not found', 'NOT_FOUND', 404);
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return errorResponse(res, 'Movie not found', 'NOT_FOUND', 404);
    }

    // Check for screen schedule conflicts on the same date and overlapping time
    const startOfDate = new Date(new Date(showDate).setHours(0, 0, 0, 0));
    const endOfDate = new Date(new Date(showDate).setHours(23, 59, 59, 999));

    const existingShows = await Show.find({
      screen: screenId,
      showDate: { $gte: startOfDate, $lte: endOfDate },
      startTime,
      status: 'ACTIVE',
    });

    if (existingShows.length > 0) {
      return errorResponse(
        res,
        `Schedule Conflict: Screen '${screen.name}' already has a show scheduled at ${startTime} on this date.`,
        'SCHEDULE_CONFLICT',
        409
      );
    }

    // Build initial seatStatus array from screen layout
    const seatStatus = screen.seatLayout.map((seat) => ({
      seatId: `${seat.row}${seat.number}`,
      row: seat.row,
      number: seat.number,
      seatType: seat.seatType,
      priceMultiplier: seat.priceMultiplier,
      price: Math.round(basePrice * seat.priceMultiplier),
      status: seat.status === 'ACTIVE' ? 'AVAILABLE' : 'DISABLED',
    }));

    const show = await Show.create({
      movie: movieId,
      venue: venueId,
      screen: screenId,
      showDate,
      startTime,
      language: language || movie.language,
      format,
      basePrice,
      seatStatus,
    });

    return successResponse(res, show, 'Show created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!show) {
      return errorResponse(res, 'Show not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, show, 'Show updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return errorResponse(res, 'Show not found', 'NOT_FOUND', 404);
    }

    show.status = 'CANCELLED';
    await show.save();

    return successResponse(res, null, 'Show cancelled successfully');
  } catch (err) {
    next(err);
  }
};
