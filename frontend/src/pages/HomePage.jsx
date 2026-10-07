import React, { useEffect, useState } from 'react';
import { TrendingUp, Star, Clock, Calendar, Zap, Flame } from 'lucide-react';
import api from '../services/api.js';
import HeroBanner from '../components/HeroBanner.jsx';
import MovieCard from '../components/MovieCard.jsx';
import EventCard from '../components/EventCard.jsx';
import ContentRow from '../components/ContentRow.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function HomePage() {
  const [data, setData] = useState({
    trending: [],
    popular: [],
    topRated: [],
    comingSoon: [],
    events: [],
    nearbyEvents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trendingRes, popularRes, topRatedRes, comingSoonRes, eventsRes] = await Promise.allSettled([
          api.get('/movies/trending'),
          api.get('/movies/popular'),
          api.get('/movies/top-rated'),
          api.get('/movies/coming-soon'),
          api.get('/events?limit=8'),
        ]);

        setData({
          trending: trendingRes.status === 'fulfilled' ? trendingRes.value.data?.data || [] : [],
          popular: popularRes.status === 'fulfilled' ? popularRes.value.data?.data || [] : [],
          topRated: topRatedRes.status === 'fulfilled' ? topRatedRes.value.data?.data || [] : [],
          comingSoon: comingSoonRes.status === 'fulfilled' ? comingSoonRes.value.data?.data || [] : [],
          events: eventsRes.status === 'fulfilled' ? eventsRes.value.data?.data?.events || [] : [],
        });
      } catch (err) {
        console.error('Homepage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner message="Loading CineVerse..." />;

  const heroMovies = [...data.trending, ...data.popular].slice(0, 5);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Hero Banner */}
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}

      {/* Content Rows */}
      <div className="container" style={{ paddingTop: '48px' }}>

        {data.trending.length > 0 && (
          <ContentRow title="🔥 Trending Now" icon={Flame}>
            {data.trending.map((m) => (
              <div key={m._id} style={{ scrollSnapAlign: 'start' }}>
                <MovieCard movie={m} />
              </div>
            ))}
          </ContentRow>
        )}

        {data.popular.length > 0 && (
          <ContentRow title="⭐ Popular Movies" icon={Star}>
            {data.popular.map((m) => (
              <div key={m._id} style={{ scrollSnapAlign: 'start' }}>
                <MovieCard movie={m} />
              </div>
            ))}
          </ContentRow>
        )}

        {data.topRated.length > 0 && (
          <ContentRow title="🏆 Top Rated" icon={TrendingUp}>
            {data.topRated.map((m) => (
              <div key={m._id} style={{ scrollSnapAlign: 'start' }}>
                <MovieCard movie={m} />
              </div>
            ))}
          </ContentRow>
        )}

        {data.comingSoon.length > 0 && (
          <ContentRow title="📅 Coming Soon" icon={Clock}>
            {data.comingSoon.map((m) => (
              <div key={m._id} style={{ scrollSnapAlign: 'start' }}>
                <MovieCard movie={m} />
              </div>
            ))}
          </ContentRow>
        )}

        {/* Events Row */}
        {data.events.length > 0 && (
          <ContentRow title="🎵 Upcoming Events" icon={Calendar}>
            {data.events.map((e) => (
              <div key={e._id} style={{ scrollSnapAlign: 'start', minWidth: '280px' }}>
                <EventCard event={e} />
              </div>
            ))}
          </ContentRow>
        )}

        {/* Empty State if no data */}
        {heroMovies.length === 0 && data.events.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-secondary)'
          }}>
            <Zap size={60} color="var(--accent-red)" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ color: '#fff', marginBottom: '12px' }}>Welcome to CineVerse!</h2>
            <p style={{ marginBottom: '24px' }}>
              Connect to the backend and run <code style={{ color: 'var(--accent-red)' }}>npm run seed</code> to populate movies and events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
