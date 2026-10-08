import { Movie } from '../models/Movie.js';
import { Event } from '../models/Event.js';
import { Venue } from '../models/Venue.js';
import { escapeRegex } from '../utils/search.js';
import { successResponse } from '../utils/apiResponse.js';

const CITIES = ['Vijayawada', 'Visakhapatnam', 'Guntur', 'Tirupati', 'Nellore', 'Kadapa', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Anantapur', 'Eluru', 'Ongole', 'Machilipatnam', 'Srikakulam', 'Vizianagaram', 'Bhimavaram'];

export const globalSearch = async (req, res, next) => {
  try {
    const term = String(req.query.q || '').trim().slice(0, 80);
    if (term.length < 2) return successResponse(res, { movies: [], events: [], venues: [], cities: [] }, 'Enter at least two characters');
    const pattern = new RegExp(escapeRegex(term), 'i');
    const cityPattern = /^vizag$/i.test(term) ? /^(Visakhapatnam|Vizag)$/i : pattern;
    const [movies, events, venues] = await Promise.all([
      Movie.find({ status: 'ACTIVE', $or: [{ title: pattern }, { description: pattern }, { cast: pattern }, { director: pattern }, { genre: pattern }] }).select('title slug language genre poster').limit(5),
      Event.find({ status: 'ACTIVE', $or: [{ name: pattern }, { description: pattern }, { city: pattern }, { category: pattern }] }).select('name slug city poster category').limit(5),
      Venue.find({ status: 'ACTIVE', type: 'CINEMA', $or: [{ name: pattern }, { city: cityPattern }, { address: pattern }] }).select('name city address').limit(5),
    ]);
    const cities = /^vizag$/i.test(term) ? ['Visakhapatnam'] : CITIES.filter((city) => pattern.test(city)).slice(0, 5);
    return successResponse(res, { movies, events, venues, cities }, 'Search results retrieved');
  } catch (err) {
    next(err);
  }
};
