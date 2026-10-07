import { Show } from '../models/Show.js';
import { holdMovieSeats, releaseExpiredHolds } from '../services/bookingService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getShowSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;

    // Release expired seat holds first
    await releaseExpiredHolds(showId);

    const show = await Show.findById(showId).populate('movie venue screen');
    if (!show) {
      return errorResponse(res, 'Show not found', 'NOT_FOUND', 404);
    }

    const now = new Date();

    // Map seats so expired holds appear as AVAILABLE to the user
    const seats = show.seatStatus.map((seat) => {
      const isExpiredHold = seat.status === 'HELD' && seat.holdExpiresAt && new Date(seat.holdExpiresAt) < now;
      const effectiveStatus = isExpiredHold ? 'AVAILABLE' : seat.status;
      const isHeldByMe = seat.status === 'HELD' && req.user && seat.heldBy?.toString() === req.user._id.toString();

      return {
        seatId: seat.seatId,
        row: seat.row,
        number: seat.number,
        seatType: seat.seatType,
        priceMultiplier: seat.priceMultiplier,
        price: seat.price,
        status: isHeldByMe ? 'SELECTED' : effectiveStatus,
        holdExpiresAt: seat.holdExpiresAt,
      };
    });

    return successResponse(
      res,
      {
        showId: show._id,
        movie: show.movie,
        venue: show.venue,
        screen: show.screen,
        showDate: show.showDate,
        startTime: show.startTime,
        basePrice: show.basePrice,
        seats,
      },
      'Seat status retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const holdSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body; // Array of seat IDs e.g. ["A1", "A2"]

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return errorResponse(res, 'No seat IDs provided', 'BAD_REQUEST', 400);
    }

    const holdResult = await holdMovieSeats(showId, seatIds, req.user._id);

    return successResponse(
      res,
      holdResult,
      `Seats [${seatIds.join(', ')}] placed on hold for ${holdResult.holdDurationMinutes} minutes.`
    );
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.errorCode, err.statusCode);
    }
    next(err);
  }
};
