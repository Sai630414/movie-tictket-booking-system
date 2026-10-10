import React, { useEffect, useState } from 'react';
import { Calendar, Zap } from 'lucide-react';
import api from '../services/api.js';
import HeroBanner from '../components/HeroBanner.jsx';
import MovieCard from '../components/MovieCard.jsx';
import EventCard from '../components/EventCard.jsx';
import ContentRow from '../components/ContentRow.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';

const emptyData = { nowShowing: [], events: [] };

export default function HomePage() {
  const { selectedCity } = useCity();
  const [data, setData] = useState(emptyData);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [moviesError, setMoviesError] = useState(false);
  const [eventsError, setEventsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMoviesLoading(true);
    setEventsLoading(true);
    setMoviesError(false);
    setEventsError(false);
    setData(emptyData);

    const loadMovies = async () => {
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
    };

    const loadEvents = async () => {
      try {
        const response = await api.get('/events?limit=8');
        if (!cancelled) {
          const events = response.data?.data?.events || [];
          setData((current) => ({ ...current, events: events.filter((event) => event.status === 'ACTIVE') }));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Homepage events fetch error:', error);
          setEventsError(true);
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };

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
        {!moviesLoading && data.nowShowing.length > 0 && (
          <ContentRow title={`Now Showing in ${selectedCity}`} icon={Calendar}>
            {data.nowShowing.map((movie) => <div key={movie._id} style={{ scrollSnapAlign: 'start' }}><MovieCard movie={movie} /></div>)}
          </ContentRow>
        )}
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
          </ContentRow>
        )}
      </div>
    </div>
  );
}
