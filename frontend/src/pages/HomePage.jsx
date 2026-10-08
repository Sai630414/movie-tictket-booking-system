import React, { useEffect, useState } from 'react';
<<<<<<< ours
import { Calendar, Zap } from 'lucide-react';
=======
import { TrendingUp, Star, Clock, Calendar, Zap, Flame, Film } from 'lucide-react';
>>>>>>> theirs
import api from '../services/api.js';
import HeroBanner from '../components/HeroBanner.jsx';
import MovieCard from '../components/MovieCard.jsx';
import EventCard from '../components/EventCard.jsx';
import ContentRow from '../components/ContentRow.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';

<<<<<<< ours
const emptyData = { nowShowing: [], events: [] };
=======
const emptyData = {
  nowShowing: [],
  telugu: [],
  trending: [],
  popular: [],
  topRated: [],
  comingSoon: [],
  events: [],
};

const getList = (result, path) => {
  if (result.status !== 'fulfilled') return [];
  return path.reduce((value, key) => value?.[key], result.value.data) || [];
};
>>>>>>> theirs

export default function HomePage() {
  const { selectedCity } = useCity();
  const [data, setData] = useState(emptyData);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [moviesError, setMoviesError] = useState(false);
  const [eventsError, setEventsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
<<<<<<< ours
=======
    const cityQuery = encodeURIComponent(selectedCity);

>>>>>>> theirs
    setMoviesLoading(true);
    setEventsLoading(true);
    setMoviesError(false);
    setEventsError(false);
    setData(emptyData);

    const loadMovies = async () => {
<<<<<<< ours
      try {
        const response = await api.get(`/movies/available?city=${encodeURIComponent(selectedCity)}`);
        if (!cancelled) setData((current) => ({ ...current, nowShowing: response.data?.data?.movies || [] }));
      } catch (error) {
        if (!cancelled) {
          console.error('Homepage movies fetch error:', error);
          setMoviesError(true);
        }
      } finally {
        if (!cancelled) setMoviesLoading(false);
      }
=======
      const results = await Promise.allSettled([
        api.get(`/movies?city=${cityQuery}&limit=10`),
        api.get('/movies?language=Telugu&limit=12'),
        api.get('/movies/trending'),
        api.get('/movies/popular'),
        api.get('/movies/top-rated'),
        api.get('/movies/coming-soon'),
      ]);

      if (cancelled) return;
      const fulfilledCount = results.filter((result) => result.status === 'fulfilled').length;
      setData((current) => ({
        ...current,
        nowShowing: getList(results[0], ['data', 'movies']),
        telugu: getList(results[1], ['data', 'movies']),
        trending: getList(results[2], ['data']),
        popular: getList(results[3], ['data']),
        topRated: getList(results[4], ['data']),
        comingSoon: getList(results[5], ['data']),
      }));
      setMoviesError(fulfilledCount === 0);
      setMoviesLoading(false);
>>>>>>> theirs
    };

    const loadEvents = async () => {
      try {
<<<<<<< ours
        const response = await api.get('/events?limit=8');
        if (!cancelled) {
          const events = response.data?.data?.events || [];
          setData((current) => ({ ...current, events: events.filter((event) => event.status === 'ACTIVE') }));
        }
=======
        // Events span nearby cities (for example, VITOPIA in Amaravati), so
        // keep the event rail independent of the selected movie city.
        const response = await api.get('/events?limit=8');
        if (cancelled) return;
        const events = response.data?.data?.events || [];
        setData((current) => ({
          ...current,
          events: events.filter((event) => event.status === 'ACTIVE'),
        }));
>>>>>>> theirs
      } catch (error) {
        if (!cancelled) {
          console.error('Homepage events fetch error:', error);
          setEventsError(true);
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };

<<<<<<< ours
    loadMovies();
    loadEvents();
    return () => { cancelled = true; };
  }, [selectedCity]);

  const heroMovies = data.nowShowing.slice(0, 5);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}
      <div className="container" style={{ paddingTop: heroMovies.length > 0 ? '48px' : '120px' }}>
        {moviesLoading && <LoadingSpinner message="Loading movies..." />}
        {!moviesLoading && moviesError && <p role="status" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Movies are temporarily unavailable. Please try again shortly.</p>}
=======
    loadMovies().catch((error) => {
      if (!cancelled) {
        console.error('Homepage movies fetch error:', error);
        setMoviesError(true);
        setMoviesLoading(false);
      }
    });
    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  const heroMovies = [...data.trending, ...data.popular]
    .filter((movie, index, movies) => movies.findIndex((item) => item._id === movie._id) === index)
    .slice(0, 5);
  const hasMovies = [
    data.nowShowing,
    data.telugu,
    data.trending,
    data.popular,
    data.topRated,
    data.comingSoon,
  ].some((movies) => movies.length > 0);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Keep the featured movie hero independent from event loading. */}
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}

      <div className="container" style={{ paddingTop: heroMovies.length > 0 ? '48px' : '120px' }}>
        {moviesLoading && <LoadingSpinner message="Loading movies..." />}
        {!moviesLoading && moviesError && (
          <p role="status" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Movies are temporarily unavailable. Please try again shortly.
          </p>
        )}

>>>>>>> theirs
        {!moviesLoading && data.nowShowing.length > 0 && (
          <ContentRow title={`Now Showing in ${selectedCity}`} icon={Calendar}>
            {data.nowShowing.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}
<<<<<<< ours
        {!moviesLoading && !moviesError && data.nowShowing.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
            <Zap size={44} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: '#fff', marginBottom: '12px' }}>No movies available in {selectedCity}</h2>
            <p>There are no upcoming shows with available seats in this city.</p>
          </div>
        )}
        {eventsLoading && <LoadingSpinner message="Loading upcoming events..." />}
        {!eventsLoading && eventsError && <p role="status" style={{ color: 'var(--text-muted)', marginBottom: '48px' }}>Upcoming events are temporarily unavailable.</p>}
        {!eventsLoading && !eventsError && data.events.length > 0 && (
          <ContentRow title="Upcoming Events" icon={Calendar}>
            {data.events.map((event) => <div key={event._id} style={{ scrollSnapAlign: 'start', minWidth: '280px' }}><EventCard event={event} /></div>)}
=======

        {!moviesLoading && data.telugu.length > 0 && (
          <ContentRow title="Telugu Cinema" icon={Film}>
            {data.telugu.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}

        {!moviesLoading && data.trending.length > 0 && (
          <ContentRow title="🔥 Trending Now" icon={Flame}>
            {data.trending.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}

        {!moviesLoading && data.popular.length > 0 && (
          <ContentRow title="⭐ Popular Movies" icon={Star}>
            {data.popular.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}

        {!moviesLoading && data.topRated.length > 0 && (
          <ContentRow title="🏆 Top Rated" icon={TrendingUp}>
            {data.topRated.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}

        {!moviesLoading && data.comingSoon.length > 0 && (
          <ContentRow title="📅 Coming Soon" icon={Clock}>
            {data.comingSoon.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}

        {!moviesLoading && !moviesError && !hasMovies && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
            <Zap size={44} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: '#fff', marginBottom: '12px' }}>No movies available right now</h2>
            <p>Check back soon for new releases and showtimes.</p>
          </div>
        )}

        {eventsLoading && <LoadingSpinner message="Loading upcoming events..." />}
        {!eventsLoading && eventsError && (
          <p role="status" style={{ color: 'var(--text-muted)', marginBottom: '48px' }}>
            Upcoming events are temporarily unavailable.
          </p>
        )}
        {!eventsLoading && !eventsError && data.events.length > 0 && (
          <ContentRow title="🎵 Upcoming Events" icon={Calendar}>
            {data.events.map((event) => (
              <div key={event._id} style={{ scrollSnapAlign: 'start', minWidth: '280px' }}>
                <EventCard event={event} />
              </div>
            ))}
>>>>>>> theirs
          </ContentRow>
        )}
      </div>
    </div>
  );
}
