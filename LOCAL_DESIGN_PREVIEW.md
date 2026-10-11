# CineVerse UI design and validation

The frontend uses a black cinema wallpaper, coral actions, violet accents and a locally hosted Manrope font. Shared wallpaper styling applies to public, authentication and admin pages; content panels retain solid backgrounds for readability.

## Curved movie reel

The home page displays a slowly looping filmstrip with language filters. Only posters, borders and sprocket holes occupy the slim black strip. Movie details and booking links sit below it. Canvas 2D projects the entire group through one cylindrical surface, so artwork, perforations, captions and buttons bend and move together. Cached artwork and text render at 2-3 times resolution for crisp output. There is no WebGL renderer.

Native links remain available for pointer and keyboard interaction, with a visible focus outline. Play/pause controls stop or resume playback. Horizontal dragging, swiping, wheel input and arrow keys pause the reel; ordinary vertical scrolling and hovering leave playback running. Space toggles playback when the reel viewport is focused. Reduced-motion preferences disable initial autoplay.

## Local setup

Follow the environment and service setup in [README.md](README.md), then run `npm ci` and `npm run dev` inside `frontend`. The UI uses the existing backend API and booking routes. This change does not provide a mock API or replace authentication or payment services.

For an independently configured sample catalog, setting `VITE_DESIGN_PREVIEW=true` displays a development-only notice. It does not inject sample data. Keep local environment files and credentials outside version control.

## Validation

Run these commands from `frontend`:

```sh
npm run lint
npm run test:reel
npm run build
```

Geometry tests cover symmetry, depth, continuity and projection coverage at mobile and desktop widths. Browser checks with a local sample catalog covered responsive layouts, playback, pause, horizontal drag, vertical scrolling, keyboard controls, language filtering, movie links and route cleanup. Loop rendering was compared within one channel value of antialiasing rounding. Live authentication, seat reservation and payment transactions were not exercised with configured external services.

## Assets

- `frontend/public/design/cinema-wallpaper-v2.png`: generated from the supplied cinema doodle reference; displayed at 15% opacity on desktop and 13% on mobile.
- `frontend/public/design/fonts/Manrope-Variable.ttf`: locally hosted font with its SIL Open Font License included alongside it.
