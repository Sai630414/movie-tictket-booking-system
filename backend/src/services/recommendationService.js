import { Movie } from '../models/Movie.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';

export const getRecommendedContent = async (user = null) => {
  let preferredLanguage = user?.preferredLanguage || 'English';
  let preferredGenres = [];

  if (user) {
    const userBookings = await Booking.find({ user: user._id }).populate('movie event');
    userBookings.forEach((b) => {
      if (b.movie?.genre) {
        preferredGenres.push(...b.movie.genre);
      }
    });
  }

  // Find movies matching language or genre or top rating
  const query = { status: 'ACTIVE' };
  if (preferredGenres.length > 0) {
    query.genre = { $in: preferredGenres };
  } else if (preferredLanguage) {
    query.language = preferredLanguage;
  }

  let movies = await Movie.find(query).sort({ rating: -1, releaseDate: -1 }).limit(10);
  if (movies.length < 5) {
    movies = await Movie.find({ status: 'ACTIVE' }).sort({ rating: -1 }).limit(10);
  }

  const events = await Event.find({ status: 'ACTIVE' }).sort({ date: 1 }).limit(6);

  return {
    movies,
    events,
  };
};
