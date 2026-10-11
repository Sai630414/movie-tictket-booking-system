import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import MovieCard from './MovieCard.jsx';
import { drawFilmRail, filmSurface, releaseFilmRail } from '../utils/filmRail.js';

const CARD_WIDTH = 260;

export default function MovieReel({ movies }) {
  const viewportRef = useRef(null);
  const ribbonRef = useRef(null);
  const playingRef = useRef(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [playing, setPlaying] = useState(playingRef.current);
  const [width, setWidth] = useState(1200);
  const dragRef = useRef(null), suppressClickRef = useRef(false);
  const positionRef = useRef(0), cycleRef = useRef(0);
  const repeats = Math.max(1, Math.ceil((width + CARD_WIDTH) / (Math.max(movies.length, 1) * CARD_WIDTH)));
  const cycleMovies = useMemo(() => Array.from({ length: repeats }, () => movies).flat(), [movies, repeats]);

  const setPlayback = value => {
    playingRef.current = value;
    setPlaying(value);
    positionRef.current = viewportRef.current?.scrollLeft || 0;
  };
  const wrap = () => {
    const cycle = cycleRef.current;
    const viewport = viewportRef.current;
    if (!cycle || !viewport) return;
    while (positionRef.current >= cycle * 2) positionRef.current -= cycle;
    while (positionRef.current < cycle) positionRef.current += cycle;
    viewport.scrollLeft = positionRef.current;
  };

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    cycleRef.current = cycleMovies.length * CARD_WIDTH;
    positionRef.current = cycleRef.current;
    viewport.scrollLeft = positionRef.current;
    const observer = new ResizeObserver(() => setWidth(viewport.clientWidth));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [cycleMovies]);

  useEffect(() => {
    const canvas = ribbonRef.current;
    let frame, last = 0;
    const animate = time => {
      const delta = last ? Math.min((time - last) / 1000, .05) : 0;
      last = time;
      if (playingRef.current && !document.hidden && !dragRef.current?.moved) { positionRef.current += delta * 9; wrap(); }
      const viewport = viewportRef.current;
      if (viewport) {
        const cards = viewport.querySelectorAll('.cv-reel-card');
        drawFilmRail(ribbonRef.current, viewport.clientWidth, positionRef.current, cards);
        for (const card of cards) {
          const center = card.offsetLeft - positionRef.current + CARD_WIDTH / 2;
          const surface = filmSurface(center, viewport.clientWidth);
          card.style.setProperty('--reel-shift', `${surface.x - center}px`);
          card.style.setProperty('--reel-width', String(surface.horizontal));
          card.style.setProperty('--reel-scale', String(surface.scale));
          card.style.zIndex = String(Math.round(surface.scale * 100));
        }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => { if (media.matches) setPlayback(false); };
    media.addEventListener('change', onPreference);
    const viewport = viewportRef.current;
    const onWheel = event => {
      const horizontal = event.shiftKey ? event.deltaX || event.deltaY : event.deltaX;
      if (!event.shiftKey && Math.abs(horizontal) <= Math.max(4, Math.abs(event.deltaY) * 1.2)) return;
      event.preventDefault(); setPlayback(false); positionRef.current = viewport.scrollLeft + horizontal; wrap();
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => { cancelAnimationFrame(frame); releaseFilmRail(canvas); media.removeEventListener('change', onPreference); viewport.removeEventListener('wheel', onWheel); };
  }, []);

  const finishDrag = () => {
    if (!dragRef.current) return;
    suppressClickRef.current = dragRef.current.moved;
    dragRef.current = null;
    viewportRef.current.classList.remove('is-dragging');
    positionRef.current = viewportRef.current.scrollLeft;
    wrap();
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  };

  return <section className="cv-reel" aria-label="Movie film reel">
    <div className="cv-reel-toolbar"><p>A slow reel. Drag or swipe to take control.</p>
      <button type="button" className="btn-secondary cv-reel-toggle" onClick={() => setPlayback(!playingRef.current)} aria-label={playing ? 'Pause film reel' : 'Play film reel'}>
        {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{playing ? 'Pause reel' : 'Play reel'}
      </button>
    </div>
    <div className="cv-reel-stage">
    <canvas ref={ribbonRef} className="cv-film-ribbon" aria-hidden="true" />
    <div className="cv-reel-viewport" ref={viewportRef} tabIndex={0} aria-label="Scrollable movie reel. Use arrow keys to browse; Space toggles playback."
      onPointerDown={event => { if (event.button > 0) return; dragRef.current = { x: event.clientX, y: event.clientY, start: event.currentTarget.scrollLeft, id: event.pointerId, moved: false }; }}
      onPointerMove={event => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (!drag.moved && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; return; }
        if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { setPlayback(false); drag.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); }
        if (drag.moved) { positionRef.current = drag.start - dx; event.currentTarget.scrollLeft = positionRef.current; event.preventDefault(); }
      }}
      onPointerUp={finishDrag} onPointerCancel={finishDrag}
      onClickCapture={event => { if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); } }}
      onFocusCapture={event => { if (event.target !== event.currentTarget && event.target.matches(':focus-visible')) setPlayback(false); }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setPlayback(false); positionRef.current += event.key === 'ArrowRight' ? 150 : -150; wrap(); }
        if (event.key === ' ') { event.preventDefault(); setPlayback(!playingRef.current); }
      }}>
      <div className="cv-reel-track">
        {[0, 1, 2].map(copy => cycleMovies.map((movie, index) => <MovieCard key={`${copy}-${movie._id}-${index}`} movie={movie} reel tabIndex={copy === 1 ? 0 : -1} />))}
      </div>
    </div></div>
  </section>;
}
