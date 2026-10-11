import React, { useEffect, useState } from 'react';
import { Calendar, Zap } from 'lucide-react';
import api from '../services/api.js';
import MovieReel from '../components/MovieReel.jsx';
import EventCard from '../components/EventCard.jsx';
import ContentRow from '../components/ContentRow.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useCity } from '../context/CityContext.jsx';

const emptyData = { nowShowing: [], events: [] };

export default function HomePage() {
  const { selectedCity } = useCity();
  const [data, setData] = useState(emptyData);
  const [language, setLanguage] = useState('All');
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [moviesError, setMoviesError] = useState(false);
  const [eventsError, setEventsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMoviesLoading(true);
    setLanguage('All');
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


 const languages = ['All', ...new Set(data.nowShowing.map(movie => movie.language).filter(Boolean))];
 const shownMovies = language === 'All' ? data.nowShowing : data.nowShowing.filter(movie => movie.language === language);
 return <main className="cv-home container">
  {import.meta.env.DEV && import.meta.env.VITE_DESIGN_PREVIEW === 'true' && <p className="cv-preview-notice">Design preview · Sample catalog · Sign-in and payments need configured services</p>}
  <div className="cv-home-location"><span className="cv-status-dot" />Good times in <strong>{selectedCity}</strong><span>Movies, events, and your next night out.</span></div>
  <header className="cv-section-heading"><div><span className="cv-eyebrow">Your plans, upgraded</span><h1>Now showing in {selectedCity}</h1></div><span className="cv-count">{data.nowShowing.length} films to discover</span></header>
  {moviesLoading && <LoadingSpinner message="Loading movies..." />}
  {!moviesLoading && moviesError && <p role="status" className="cv-empty">Movies are temporarily unavailable. Please try again shortly.</p>}
  {!moviesLoading && data.nowShowing.length > 0 && <>
   <div className="cv-language-filters" role="group" aria-label="Filter movies by language">{languages.map(value => <button key={value} type="button" aria-pressed={language === value} onClick={() => setLanguage(value)}>{value === 'All' ? 'All languages' : value}</button>)}</div>
   {shownMovies.length ? <MovieReel movies={shownMovies} /> : <p role="status" className="cv-empty">No movies in this language. Select another filter.</p>}
  </>}
  {!moviesLoading && !moviesError && !data.nowShowing.length && <div className="cv-empty"><Zap size={32} aria-hidden="true" /><h2>No movies available in {selectedCity}</h2><p>There are no upcoming shows with available seats in this city.</p></div>}
  <aside className="cv-intermission"><div><span className="cv-eyebrow">The unofficial rule</span><h2>Great stories. Better company. Extra popcorn.</h2></div><span>Make it a movie night.</span></aside>
  {eventsLoading && <LoadingSpinner message="Loading upcoming events..." />}
  {!eventsLoading && eventsError && <p role="status" className="cv-empty">Upcoming events are temporarily unavailable.</p>}
  {!eventsLoading && !eventsError && data.events.length > 0 && <ContentRow title="Upcoming events" icon={Calendar}>{data.events.map(event => <div key={event._id} style={{ minWidth: 280 }}><EventCard event={event} /></div>)}</ContentRow>}
 </main>;
}
