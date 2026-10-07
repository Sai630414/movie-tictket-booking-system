import { Movie } from '../models/Movie.js';
import { Show } from '../models/Show.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import slugify from 'slugify';
import { escapeRegex } from '../utils/search.js';

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
    const movies = await Movie.find({
      $or: [{ releaseType: 'COMING_SOON' }, { releaseDate: { $gt: new Date() } }],
    })
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
    const movie = await Movie.findOne({ slug });

    if (!movie) {
      return errorResponse(res, 'Movie not found', 'NOT_FOUND', 404);
    }

    // Retrieve active shows for this movie
    const shows = await Show.find({ movie: movie._id, status: 'ACTIVE', showDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
      .populate('venue screen')
      .sort({ showDate: 1, startTime: 1 });

    return successResponse(res, { movie, shows }, 'Movie details retrieved');
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
