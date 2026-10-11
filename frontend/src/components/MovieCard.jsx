import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Film, Star } from 'lucide-react';
export default function MovieCard({ movie, reel = false, tabIndex = 0 }) {
 const [failedPoster, setFailedPoster] = useState(null);
 if (!movie) return null;
 const href = '/movies/' + movie.slug, comingSoon = movie.releaseType === 'COMING_SOON';
 return <article className={'cv-movie-card' + (reel ? ' cv-reel-card' : '')}>
  <Link to={href} className="cv-poster" tabIndex={tabIndex} aria-label={'View ' + movie.title}>
   {movie.poster && failedPoster !== movie.poster ? <img src={movie.poster} alt={movie.title} loading="lazy" draggable="false" onError={() => setFailedPoster(movie.poster)} /> : <div className="cv-poster-fallback"><Film aria-hidden="true" size={28} /><strong>{movie.title}</strong><span>{movie.language}</span></div>}
  </Link>
  <div className="cv-movie-info"><div className="cv-movie-rating">{movie.rating > 0 ? <><Star size={13} fill="currentColor" aria-hidden="true" /><span>{Number(movie.rating).toFixed(1)} / 10</span></> : <span className="cv-rating-pending">{comingSoon ? 'Coming soon' : 'Now showing'}</span>}<span>{movie.formats?.[0] || '2D'}</span></div>
   <h3><Link to={href} tabIndex={tabIndex}>{movie.title}</Link></h3><p>{movie.genre?.join(' / ')}</p><p>{movie.language}{movie.certification ? ' · ' + movie.certification : ''}</p>
   <Link to={href} className="btn-primary cv-book-button" data-motion tabIndex={tabIndex} aria-label={(comingSoon ? 'View details for ' : 'Book tickets for ') + movie.title}>{comingSoon ? 'View details' : 'Book tickets'}<ArrowUpRight size={16} aria-hidden="true" /></Link>
  </div>
 </article>;
}
