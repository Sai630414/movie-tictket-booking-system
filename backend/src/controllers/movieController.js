import { Movie } from '../models/Movie.js';
import { Show } from '../models/Show.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import slugify from 'slugify';
import { escapeRegex } from '../utils/search.js';
import { Venue } from '../models/Venue.js';

const getShowStartDate = (show) => {
  const date = new Date(show.showDate);
  const match = String(show.startTime || '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return date;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3]) {
    if (hours === 12) hours = 0;
    if (match[3].toUpperCase() === 'PM') hours += 12;
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes));
};

export const getAvailableMovies = async (req, res, next) => {
  try {
    const city = String(req.query.city || '').trim();
    if (!city) return errorResponse(res, 'City is required', 'CITY_REQUIRED', 400);

    const now = new Date();
    const venues = await Venue.find({
      status: 'ACTIVE', active: true, type: 'CINEMA',
      city: { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') },
    }).select('_id name city');
    const venueById = new Map(venues.map((venue) => [String(venue._id), venue]));
    if (!venues.length) return successResponse(res, { movies: [] }, 'Available movies retrieved');

    const shows = await Show.find({ status: 'ACTIVE', venue: { $in: venues.map((venue) => venue._id) }, showDate: { $gte: new Date(now.toISOString().slice(0, 10)) } })
      .populate({ path: 'movie', match: { status: 'ACTIVE' }, select: 'title slug poster language genre rating formats releaseDate releaseType status' })
      .sort({ showDate: 1 });
    const availableShows = shows.filter((show) => show.movie && getShowStartDate(show) > now &&
      show.seatStatus?.some((seat) => seat.status === 'AVAILABLE' || (seat.status === 'HELD' && seat.holdExpiresAt && seat.holdExpiresAt <= now)));

    const moviesById = new Map();
    for (const show of availableShows) {
      const movieId = String(show.movie._id);
      const venue = venueById.get(String(show.venue));
      if (!venue) continue;
      if (!moviesById.has(movieId)) moviesById.set(movieId, { ...show.movie.toObject(), city, venues: [] });
      const movie = moviesById.get(movieId);
      let movieVenue = movie.venues.find((item) => String(item.id) === String(venue._id));
      if (!movieVenue) {
        movieVenue = { id: venue._id, name: venue.name, nextShow: show.startTime };
        movie.venues.push(movieVenue);
      }
    }
    return successResponse(res, { movies: [...moviesById.values()] }, 'Available movies retrieved');
  } catch (err) { next(err); }
};

export const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      language,
      genre,
      rating,
      releaseType,
      format,
      city,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: 'ACTIVE' };

    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } },
        { cast: { $regex: escapeRegex(search), $options: 'i' } },
        { director: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    if (language) {
      query.language = { $regex: new RegExp(`^${escapeRegex(language)}$`, 'i') };
    }

    if (genre) {
      const genresList = Array.isArray(genre) ? genre : genre.split(',');
      query.genre = { $in: genresList.map((g) => new RegExp(escapeRegex(g.trim()), 'i')) };
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    if (releaseType) {
      query.releaseType = releaseType;
    }

    if (format) {
      query.formats = format;
    }

    if (city) {
      const venues = await Venue.find({ status: 'ACTIVE', city: { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') } }).select('_id');
      const movieIds = await Show.distinct('movie', { status: 'ACTIVE', venue: { $in: venues.map((venue) => venue._id) }, showDate: { $gte: new Date() } });
      query._id = { $in: movieIds };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const movies = await Movie.find(query)
      .sort({ releaseDate: -1, rating: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Movie.countDocuments(query);

    return successResponse(
      res,
      {
        movies,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Movies retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getTrendingMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: 'ACTIVE' })
      .sort({ rating: -1, releaseDate: -1 })
      .limit(10);
    return successResponse(res, movies, 'Trending movies retrieved');
  } catch (err) {
    next(err);
  }
};

export const getPopularMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: 'ACTIVE' })
      .sort({ rating: -1 })
      .limit(10);
    return successResponse(res, movies, 'Popular movies retrieved');
  } catch (err) {
    next(err);
  }
};

export const getTopRatedMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: 'ACTIVE', rating: { $gte: 7 } })
      .sort({ rating: -1 })
      .limit(10);
    return successResponse(res, movies, 'Top rated movies retrieved');
  } catch (err) {
    next(err);
  }
};

export const getComingSoonMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: 'ACTIVE', $or: [
      { releaseType: 'COMING_SOON' }, { releaseDate: { $gt: new Date() } },
    ] })
      .sort({ releaseDate: 1 })
      .limit(10);
    return successResponse(res, movies, 'Coming soon movies retrieved');
  } catch (err) {
    next(err);
  }
};

export const getMovieBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const movie = await Movie.findOne({ slug, status: 'ACTIVE' });

    if (!movie) {
      return errorResponse(res, 'Movie not found', 'NOT_FOUND', 404);
    }

    // Retrieve active shows for this movie
    const now = new Date();
    const showQuery = { movie: movie._id, status: 'ACTIVE', showDate: { $gte: new Date(now.toISOString().slice(0, 10)) } };
    if (req.query.city) {
      const venues = await Venue.find({ status: 'ACTIVE', city: { $regex: new RegExp(`^${escapeRegex(req.query.city)}$`, 'i') } }).select('_id');
      showQuery.venue = { $in: venues.map((venue) => venue._id) };
    }
    const shows = await Show.find(showQuery)
      .populate({ path: 'venue', match: { status: 'ACTIVE', active: true, type: 'CINEMA' } })
      .populate('screen')
      .sort({ showDate: 1, startTime: 1 });
    const bookableShows = shows.filter((show) => show.venue && getShowStartDate(show) > now &&
      show.seatStatus?.some((seat) => seat.status === 'AVAILABLE' || (seat.status === 'HELD' && seat.holdExpiresAt && seat.holdExpiresAt <= now)));

    return successResponse(res, { movie, shows: bookableShows }, 'Movie details retrieved');
  } catch (err) {
    next(err);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return errorResponse(res, 'Movie not found', 'NOT_FOUND', 404);
    }
    return successResponse(res, movie, 'Movie details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const slug = slugify(req.body.title, { lower: true, strict: true }) + '-' + Date.now();
    const movie = await Movie.create({
      ...req.body,
      slug,
    });
    return successResponse(res, movie, 'Movie created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return errorResponse(res, 'Movie not found', 'NOT_FOUND', 404);
    }

    if (req.body.title && req.body.title !== movie.title) {
      req.body.slug = slugify(req.body.title, { lower: true, strict: true }) + '-' + Date.now();
    }

    Object.assign(movie, req.body);
    await movie.save();

    return successResponse(res, movie, 'Movie updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return errorResponse(res, 'Movie not found', 'NOT_FOUND', 404);
    }

    movie.status = 'INACTIVE';
    await movie.save();

    return successResponse(res, null, 'Movie deactivated successfully');
  } catch (err) {
    next(err);
  }
};
