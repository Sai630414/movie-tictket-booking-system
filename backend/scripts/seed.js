import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';

import { Movie } from '../src/models/Movie.js';
import { Venue } from '../src/models/Venue.js';
import { Screen } from '../src/models/Screen.js';
import { Show } from '../src/models/Show.js';
import { Event } from '../src/models/Event.js';
import { Booking } from '../src/models/Booking.js';
import { User } from '../src/models/User.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/movie_event_booking';

/* ============================================================
   HELPERS
============================================================ */

const atNoon = (year, month, day) =>
  new Date(year, month - 1, day, 12, 0, 0);

const makeSlug = (value) =>
  slugify(value, {
    lower: true,
    strict: true,
  });

const rowName = (index) => {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }

  return `R${index - 25}`;
};

const makeSeatLayout = (capacity) => {
  const columns = 10;
  const rows = Math.ceil(capacity / columns);

  return Array.from({ length: capacity }, (_, index) => {
    const row = Math.floor(index / columns);

    let seatType = 'STANDARD';
    let priceMultiplier = 1;

    if (row >= rows - 2) {
      seatType = 'RECLINER';
      priceMultiplier = 1.8;
    } else if (row >= rows - 5) {
      seatType = 'PREMIUM';
      priceMultiplier = 1.3;
    }

    return {
      row: rowName(row),
      number: (index % columns) + 1,
      seatType,
      priceMultiplier,
      status: 'ACTIVE',
    };
  });
};

/* ============================================================
   MOVIES
   EXACTLY 4 MOVIES
============================================================ */

const moviesData = [
  {
    title: 'Spider-Man: Brand New Day',

    date: '2026-07-31',

    language: 'English',

    duration: null,

    director: '',

    cast: [],

    genre: [
      'Action',
      'Adventure',
      'Sci-Fi',
    ],

    certification: 'UA',

    description:
      'Spider-Man returns for a new adventure in the Marvel universe.',

    poster:
      'https://reggiestake.com/wp-content/uploads/2026/04/spider-man-brand-new-day-fan-poster-5.jpg',

    backdrop:
      'https://cdnb.artstation.com/p/assets/images/images/053/974/563/large/laura-escobar-spidey-verse.jpg?1663478046',

    trailerUrl:
      'https://www.youtube.com/watch?v=62bIsvRcPv0',

    trailer: {
      provider: 'youtube',

      videoId: '62bIsvRcPv0',

      url: 'https://www.youtube.com/watch?v=62bIsvRcPv0',

      title: 'Spider-Man: Brand New Day Trailer',

      thumbnailUrl:
        'https://i.ytimg.com/vi/62bIsvRcPv0/hqdefault.jpg',
    },

    releaseType: 'NEW_RELEASE',
  },

  {
    title: 'The Paradise',

    date: '2026-02-01',

    language: 'Telugu',

    duration: null,

    director: '',

    cast: [],

    genre: [
      'Action',
      'Drama',
      'Thriller',
    ],

    certification: 'UA',

    description:
      'A Telugu action drama set against a powerful and intense backdrop.',

    poster:
      'https://upload.wikimedia.org/wikipedia/en/b/bb/The_Paradise_%282026_Indian_film%29_poster.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail_unscaled&_=20260926000852',

    backdrop:
      'https://static.toiimg.com/thumb/msid-123190363,imgsize-823621,width-400,resizemode-4/123190363.jpg',

    trailerUrl:
      'https://www.youtube.com/watch?v=yX90gF4_EjI',

    trailer: {
      provider: 'youtube',

      videoId: 'yX90gF4_EjI',

      url: 'https://www.youtube.com/watch?v=yX90gF4_EjI',

      title: 'The Paradise Official Trailer',

      thumbnailUrl:
        'https://i.ytimg.com/vi/yX90gF4_EjI/hqdefault.jpg',
    },

    releaseType: 'NEW_RELEASE',
  },

  {
    title: 'Dhurandhar',

    date: '2026-12-05',

    language: 'Hindi',

    duration: null,

    director: '',

    cast: [],

    genre: [
      'Action',
      'Thriller',
      'Drama',
    ],

    certification: 'UA',

    description:
      'A high-intensity action thriller.',

    poster:
      'https://www.impawards.com/intl/india/2026/posters/dhurandhar_the_revenge_xlg.jpg',

    backdrop:
      'https://assets-in.bmscdn.com/discovery-catalog/events/et00478890-rpenrjddmy-landscape.jpg',

    trailerUrl:
      'https://www.youtube.com/watch?v=rV6kEsAyrdY',

    trailer: {
      provider: 'youtube',

      videoId: 'rV6kEsAyrdY',

      url: 'https://www.youtube.com/watch?v=rV6kEsAyrdY',

      title: 'Dhurandhar Official Trailer',

      thumbnailUrl:
        'https://i.ytimg.com/vi/rV6kEsAyrdY/hqdefault.jpg',
    },

    releaseType: 'COMING_SOON',
  },

  {
    title: 'Bethlehem Kudumba Unit',

    date: '2026-03-01',

    language: 'Malayalam',

    duration: null,

    director: '',

    cast: [],

    genre: [
      'Drama',
      'Family',
      'Comedy',
    ],

    certification: 'U',

    description:
      'A family-oriented Malayalam drama centered around the lives and relationships of a close-knit family.',

    poster:
      'https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/bethlehem-kudumba-unit-et00502829-1788413826.jpg',

    backdrop:
      'https://img.youtube.com/vi/fk0JHh1P9H0/0.jpg',

    trailerUrl:
      'https://www.youtube.com/watch?v=bnJG5OxkB34',

    trailer: {
      provider: 'youtube',

      videoId: 'bnJG5OxkB34',

      url: 'https://www.youtube.com/watch?v=bnJG5OxkB34',

      title: 'Bethlehem Kudumba Unit Trailer',

      thumbnailUrl:
        'https://i.ytimg.com/vi/bnJG5OxkB34/hqdefault.jpg',
    },

    releaseType: 'NEW_RELEASE',
  },
];

/* ============================================================
   EVENTS
   EXACTLY 2 EVENTS
============================================================ */

const eventsData = [
  {
    name: 'VITOPIA',

    slug: 'vitopia',

    description:
      'VITOPIA is a vibrant student festival experience featuring entertainment, performances, activities and unforgettable campus moments.',

    poster:
      'https://media.licdn.com/dms/image/v2/D5622AQEeY-VZ1BxfQA/feedshare-shrink_800/B56ZVH5vCrGUAk-/0/1740668080163?e=2147483647&v=beta&t=t8hGT0xkj8B8ecXKGkj05YoTh549EYWZHZD_p8Y48m4',

    banner:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7EZ-6UT2F4IbPj6xba0k9M1lTpH9Xz9ix3CCf4ZveQzUTMZRR9ux94xg&s=10',

    video:
      'https://www.youtube.com/watch?v=Y-zabeMoijs',

    category: 'Festival',

    date: atNoon(2026, 11, 15),

    startTime: '10:00 AM',

    endTime: '09:00 PM',

    venueKey: 'vit-ap-university',

    location:
      'VIT-AP University, Amaravati, Andhra Pradesh',

    city: 'Amaravati',

    organizer: 'VIT-AP',

    ticketCategories: [
      {
        name: 'Student Pass',

        price: 199,

        totalQuantity: 500,

        availableQuantity: 500,
      },

      {
        name: 'Premium Pass',

        price: 399,

        totalQuantity: 200,

        availableQuantity: 200,
      },

      {
        name: 'VIP Pass',

        price: 799,

        totalQuantity: 50,

        availableQuantity: 50,
      },
    ],

    status: 'ACTIVE',
  },

  {
    name: 'Anubhav Singh Bassi - Stand Up Comedy',

    slug: 'anubhav-singh-bassi-stand-up-comedy',

    description:
      'A live stand-up comedy experience featuring Anubhav Singh Bassi, bringing his signature storytelling and observational comedy to the stage.',

    poster:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXwdkXS3bIZZ_mSI8OVgFNsOzuzKV5adiiqoFuO8dn86gNZc0IJMQdfAAr&s=10',

    banner:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXwdkXS3bIZZ_mSI8OVgFNsOzuzKV5adiiqoFuO8dn86gNZc0IJMQdfAAr&s=10',

    video:
      'https://www.youtube.com/watch?v=mbOO0Z6ryO0',

    category: 'Comedy',

    date: atNoon(2026, 11, 22),

    startTime: '07:00 PM',

    endTime: '09:00 PM',

    venueKey: 'vijayawada-event-venue',

    location:
      'Vijayawada, Andhra Pradesh',

    city: 'Vijayawada',

    organizer: 'CineVerse Events',

    ticketCategories: [
      {
        name: 'Silver',

        price: 499,

        totalQuantity: 300,

        availableQuantity: 300,
      },

      {
        name: 'Gold',

        price: 799,

        totalQuantity: 200,

        availableQuantity: 200,
      },

      {
        name: 'VIP',

        price: 1299,

        totalQuantity: 75,

        availableQuantity: 75,
      },
    ],

    status: 'ACTIVE',
  },
];

/* ============================================================
   VENUES
============================================================ */

const venuesData = [
  {
    key: 'cineverse-demo-theatre',
    name: 'CineVerse Demo Theatre',
    chain: 'CineVerse',
    city: 'Vijayawada',
    address: 'Demo District, Vijayawada, Andhra Pradesh',
    capacity: 80,
    screens: 4,
    active: true,
    type: 'CINEMA',
  },

  /*
   * VIJAYAWADA
   */

  {
    key: 'pvr-vijayawada',

    name: 'PVR Vijayawada',

    chain: 'PVR INOX',

    city: 'Vijayawada',

    address:
      'Vijayawada, Andhra Pradesh',

    capacity: 220,

    screens: 4,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'inox-laila-vijayawada',

    name: 'INOX Laila Mall',

    chain: 'INOX',

    city: 'Vijayawada',

    address:
      'Laila Mall, Vijayawada',

    capacity: 200,

    screens: 3,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'inox-lepl-vijayawada',

    name: 'INOX LEPL ICON',

    chain: 'INOX',

    city: 'Vijayawada',

    address:
      'LEPL Icon, Patamata, Vijayawada',

    capacity: 220,

    screens: 4,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'capital-cinemas-trendset',

    name: 'Capital Cinemas Trendset Mall',

    chain: 'Capital Cinemas',

    city: 'Vijayawada',

    address:
      'Trendset Mall, Vijayawada',

    capacity: 200,

    screens: 4,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'vijayawada-event-venue',

    name: 'Vijayawada Event Arena',

    chain: '',

    city: 'Vijayawada',

    address:
      'Vijayawada, Andhra Pradesh',

    capacity: 1500,

    screens: 1,

    active: true,

    type: 'EVENT_VENUE',
  },

  /*
   * VISAKHAPATNAM
   */

  {
    key: 'inox-varun-beach',

    name: 'INOX Varun Beach',

    chain: 'INOX',

    city: 'Visakhapatnam',

    address:
      'Varun Beach, Visakhapatnam',

    capacity: 220,

    screens: 6,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'inox-cmr-central',

    name: 'INOX CMR Central',

    chain: 'INOX',

    city: 'Visakhapatnam',

    address:
      'CMR Central Mall, Maddilapalem',

    capacity: 210,

    screens: 4,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'jagadamba-vizag',

    name: 'Jagadamba',

    chain: '',

    city: 'Visakhapatnam',

    address:
      'Jagadamba Junction, Visakhapatnam',

    capacity: 300,

    screens: 1,

    active: true,

    type: 'CINEMA',
  },

  {
    key: 'sree-kanya-vizag',

    name: 'Sree Kanya Cine Complex',

    chain: '',

    city: 'Visakhapatnam',

    address:
      'Visakhapatnam, Andhra Pradesh',

    capacity: 220,

    screens: 3,

    active: true,

    type: 'CINEMA',
  },

  /*
   * GUNTUR
   */

  {
    key: 'the-cinema-guntur',

    name: 'The Cinema - Guntur',

    chain: 'PVR',

    city: 'Guntur',

    address:
      'Guntur, Andhra Pradesh',

    capacity: 180,

    screens: 5,

    active: true,

    type: 'CINEMA',
  },

  /*
   * KAKINADA
   */

  {
    key: 'inox-srmt-kakinada',

    name: 'INOX SRMT Mall',

    chain: 'INOX',

    city: 'Kakinada',

    address:
      'SRMT Mall, Kakinada',

    capacity: 220,

    screens: 5,

    active: true,

    type: 'CINEMA',
  },

  /*
   * KURNOOL
   */

  {
    key: 'inox-kurnool',

    name: 'INOX Kurnool',

    chain: 'INOX',

    city: 'Kurnool',

    address:
      'Kurnool, Andhra Pradesh',

    capacity: 220,

    screens: 3,

    active: true,

    type: 'CINEMA',
  },

  /*
   * KADAPA
   */

  {
    key: 'prathap-kadapa',

    name: 'Prathap Theatre',

    chain: '',

    city: 'Kadapa',

    address:
      'Kadapa, Andhra Pradesh',

    capacity: 400,

    screens: 1,

    active: false,

    type: 'CINEMA',
  },

  /*
   * TIRUPATI
   */

  {
    key: 'prathap-tirupati',

    name: 'Prathap Group Theatres',

    chain: '',

    city: 'Tirupati',

    address:
      'Tirupati, Andhra Pradesh',

    capacity: 400,

    screens: 3,

    active: false,

    type: 'CINEMA',
  },

  /*
   * NELLORE
   */

  {
    key: 'new-talkies-nellore',

    name: 'New Talkies Picture Palace',

    chain: '',

    city: 'Nellore',

    address:
      'Nellore, Andhra Pradesh',

    capacity: 350,

    screens: 1,

    active: false,

    type: 'CINEMA',
  },

  /*
   * RAJAHMUNDRY
   */

  {
    key: 'apsara-rajahmundry',

    name: 'Apsara Theatre',

    chain: '',

    city: 'Rajahmundry',

    address:
      'Rajahmundry, Andhra Pradesh',

    capacity: 400,

    screens: 1,

    active: false,

    type: 'CINEMA',
  },

  /*
   * AMARAVATI / VIT-AP
   */

  {
    key: 'vit-ap-university',

    name: 'VIT-AP University',

    chain: '',

    city: 'Amaravati',

    address:
      'VIT-AP University, Amaravati, Andhra Pradesh',

    capacity: 5000,

    screens: 1,

    active: true,

    type: 'EVENT_VENUE',
  },
];

/* ============================================================
   SHOW DATES
============================================================ */

const showTimes = [
  '09:30 AM',
  '12:30 PM',
  '03:30 PM',
  '06:30 PM',
  '09:30 PM',
];

const DEMO_SHOW_DAYS = 5;
const DEMO_THEATRE_KEY = 'cineverse-demo-theatre';
const DEMO_SHOW_KEY_PREFIX = 'cineverse-demo-show-';

/* ============================================================
   MAIN SEED
============================================================ */

const seedData = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to seed a production database.');
    }

    const databaseHost = new URL(MONGODB_URI).hostname.toLowerCase();
    const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(databaseHost);
    if (!isLocalDatabase && process.env.ALLOW_REMOTE_DEMO_SEED !== 'true') {
      throw new Error(
        'Refusing to seed a remote MongoDB host. Use a local development database, or set ALLOW_REMOTE_DEMO_SEED=true only after verifying the remote database is a development database.'
      );
    }
    if (!isLocalDatabase) {
      console.warn('[Seed safety] Remote demo seeding is explicitly enabled; verify this is a development database.');
    }

    await mongoose.connect(MONGODB_URI);

    const usersCollectionExists = await mongoose.connection.db
      .listCollections({ name: User.collection.collectionName }, { nameOnly: true })
      .hasNext();
    if (!usersCollectionExists) await User.createCollection();

    console.log('');
    console.log(
      '================================================'
    );
    console.log(
      '           🎬 CINEVERSE DATABASE SEED'
    );
    console.log(
      '================================================'
    );
    console.log('');

    /* ========================================================
       MOVIES
    ======================================================== */

    const movieDocs = new Map();

    for (const item of moviesData) {
      const movieSlug =
        makeSlug(item.title);

      const releaseDate =
        atNoon(
          ...item.date
            .split('-')
            .map(Number)
        );

      const data = {
        title:
          item.title,

        slug:
          movieSlug,

        description:
          item.description || '',

        poster:
          item.poster || '',

        backdrop:
          item.backdrop || '',

        trailerUrl:
          item.trailerUrl || '',

        ...(item.trailer
          ? {
              trailer:
                item.trailer,
            }
          : {}),

        genre:
          item.genre || [],

        language:
          item.language || 'Telugu',

        duration:
          item.duration ??
          undefined,

        rating:
          item.rating ?? 0,

        cast:
          item.cast || [],

        director:
          item.director || '',

        releaseDate,

        releaseType:
          item.releaseType ||
          'CATALOG',

        formats: [
          '2D',
        ],

        certification:
          item.certification ||
          'UA',

        status:
          'ACTIVE',
      };

      const movie =
        await Movie.findOneAndUpdate(
          {
            slug:
              movieSlug,
          },

          {
            $set:
              data,
          },

          {
            upsert:
              true,

            new:
              true,

            runValidators:
              true,
          }
        );

      movieDocs.set(
        item.title,
        movie
      );

      console.log(
        `🎬 Movie: ${item.title}`
      );
    }

    /* ========================================================
       VENUES
    ======================================================== */

    const venueDocs = [];

    for (const item of venuesData) {
      const venue =
        await Venue.findOneAndUpdate(
          {
            seedKey:
              item.key,
          },

          {
            $set: {
              seedKey:
                item.key,

              name:
                item.name,

              chain:
                item.chain || '',

              type:
                item.type === 'EVENT'
                  ? 'EVENT_VENUE'
                  : item.type ||
                'CINEMA',

              address:
                item.address ||
                '',

              city:
                item.city,

              state:
                'Andhra Pradesh',

              pincode:
                '',

              description:
                item.active
                  ? 'CineVerse venue.'
                  : 'Venue retained in the CineVerse catalogue but disabled for bookings.',

              amenities:
                item.type ===
                'EVENT_VENUE'
                  ? [
                      'Parking',
                      'Food & Beverages',
                      'Security',
                      'Online Booking',
                    ]
                  : [
                      'Parking',
                      'Food & Beverages',
                      'Online Booking',
                      'Air Conditioning',
                    ],

              totalCapacity:
                item.capacity *
                item.screens,

              status:
                item.active
                  ? 'ACTIVE'
                  : 'INACTIVE',

              active:
                item.active,
            },
          },

          {
            upsert:
              true,

            new:
              true,

            runValidators:
              true,
          }
        );

      venueDocs.push({
        venue,
        ...item,
      });

      console.log(
        `🏢 Venue: ${item.name} — ${item.city}`
      );
    }

    /* ========================================================
       VENUE MAP
    ======================================================== */

    const venueByKey =
      new Map();

    for (const item of venueDocs) {
      venueByKey.set(
        item.key,
        item.venue
      );
    }

    /* ========================================================
       SCREENS
       Only CINEMA venues get movie screens.
    ======================================================== */

    const screenDocs = [];

    for (const item of venueDocs) {
      if (
        item.type !==
        'CINEMA'
      ) {
        continue;
      }

      if (
        !item.active
      ) {
        continue;
      }

      const screenCount =
        Math.min(
          item.screens,
          4
        );

      for (
        let screenNumber = 1;
        screenNumber <=
        screenCount;
        screenNumber++
      ) {
        const seedKey =
          `${item.key}-screen-${screenNumber}`;

        const seatLayout =
          makeSeatLayout(
            item.capacity
          );

        const screen =
          await Screen.findOneAndUpdate(
            {
              seedKey,
            },

            {
              $set: {
                seedKey,

                venue:
                  item.venue
                    ._id,

                name:
                  `Screen ${screenNumber}`,

                format:
                  '2D',

                audio:
                  screenNumber ===
                  1
                    ? 'Dolby Atmos'
                    : 'Dolby Digital',

                rows:
                  Math.ceil(
                    item.capacity /
                      10
                  ),

                columns:
                  10,

                totalSeats:
                  item.capacity,

                seatLayout,
              },
            },

            {
              upsert:
                true,

              new:
                true,

              runValidators:
                true,
            }
          );

        screenDocs.push({
          screen,
          venue:
            item,
        });
      }
    }

    console.log('');
    console.log(
      `🎞️ Screens prepared: ${screenDocs.length}`
    );

    /* ========================================================
       SHOWS
       Only the requested 4 movies.
    ======================================================== */

    const demoVenue = venueByKey.get(DEMO_THEATRE_KEY);
    const demoScreens = screenDocs
      .filter(({ venue }) => venue.key === DEMO_THEATRE_KEY)
      .sort((a, b) => a.screen.name.localeCompare(b.screen.name));
    if (!demoVenue || demoScreens.length < moviesData.length) {
      throw new Error('The demo theatre must have one active screen for each seeded movie.');
    }

    let showsCreated = 0;
    let showsUpdated = 0;
    let showsProtected = 0;
    const localDateParts = new Map(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date()).map((part) => [part.type, part.value])
    );
    const today = new Date(Date.UTC(
      Number(localDateParts.get('year')),
      Number(localDateParts.get('month')) - 1,
      Number(localDateParts.get('day'))
    ));
    const demoShowKeys = [];

    for (let movieIndex = 0; movieIndex < moviesData.length; movieIndex++) {
      const movieData = moviesData[movieIndex];
      const movie = movieDocs.get(movieData.title);
      const { screen } = demoScreens[movieIndex];
      if (!movie || movie.status !== 'ACTIVE' || demoVenue.status !== 'ACTIVE') {
        throw new Error(`Missing active demo records for ${movieData.title}.`);
      }

      const firstShowDate = new Date(today);
      const releaseDay = new Date(movie.releaseDate);
      releaseDay.setUTCHours(0, 0, 0, 0);
      if (releaseDay > firstShowDate) firstShowDate.setTime(releaseDay.getTime());

      for (let dayOffset = 0; dayOffset < DEMO_SHOW_DAYS; dayOffset++) {
        const showDate = new Date(firstShowDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        showDate.setUTCHours(12, 0, 0, 0);
        const dateKey = showDate.toISOString().slice(0, 10);

        for (let timeIndex = 0; timeIndex < showTimes.length; timeIndex++) {
          const time = showTimes[timeIndex];
          const basePrice = 180 + movieIndex * 20 + timeIndex * 10;
          const seatStatus = screen.seatLayout.map((seat) => ({
            seatId: `${seat.row}${seat.number}`,
            row: seat.row,
            number: seat.number,
            seatType: seat.seatType,
            priceMultiplier: seat.priceMultiplier,
            price: Math.round(basePrice * seat.priceMultiplier),
            status: 'AVAILABLE',
            heldBy: null,
            holdExpiresAt: null,
          }));
          const timeKey = time.replace(/\W/g, '');
          const seedKey = `${DEMO_SHOW_KEY_PREFIX}${movie.slug}-${dateKey}-${timeKey}`;
          demoShowKeys.push(seedKey);
          const existingShow = await Show.findOne({ seedKey }).select('_id');
          const hasBooking = existingShow
            ? Boolean(await Booking.exists({ show: existingShow._id }))
            : false;

          const update = {
            $set: {
              movie: movie._id,
              venue: demoVenue._id,
              screen: screen._id,
              showDate,
              startTime: time,
              language: movie.language,
              format: '2D',
              basePrice,
              status: 'ACTIVE',
              ...(hasBooking ? {} : { seatStatus }),
            },
            $setOnInsert: { seedKey },
          };

          const result = await Show.updateOne({ seedKey }, update, {
            upsert: true,
            runValidators: true,
          });
          if (result.upsertedCount) showsCreated++;
          else showsUpdated++;
          if (hasBooking) showsProtected++;
        }
      }
    }

    const staleDemoShows = await Show.find({
      seedKey: { $regex: `^${DEMO_SHOW_KEY_PREFIX}`, $nin: demoShowKeys },
      status: 'ACTIVE',
    }).select('_id');
    let staleShowsCancelled = 0;
    for (const staleShow of staleDemoShows) {
      const hasBooking = await Booking.exists({ show: staleShow._id });
      if (!hasBooking) {
        await Show.updateOne({ _id: staleShow._id }, { $set: { status: 'CANCELLED' } });
        staleShowsCancelled++;
      }
    }

    /* ========================================================
       EVENTS
       EXACTLY 2
    ======================================================== */

    let eventsCreated = 0;
    let eventsUpdated = 0;
    let eventsProtected = 0;

    for (const item of eventsData) {
      const venue =
        venueByKey.get(
          item.venueKey
        );

      if (!venue) {
        console.warn(
          `⚠️ Event venue missing: ${item.name}`
        );

        continue;
      }

      if (venue.type !== 'EVENT_VENUE' || venue.status !== 'ACTIVE') {
        throw new Error(`Event ${item.name} must use an active EVENT_VENUE.`);
      }

      const existingEvent = await Event.findOne({ slug: item.slug }).select('_id ticketCategories');
      const hasBooking = existingEvent
        ? Boolean(await Booking.exists({ event: existingEvent._id }))
        : false;
      const previousAvailability = new Map(
        (existingEvent?.ticketCategories || []).map((category) => [category.name, category.availableQuantity])
      );
      const ticketCategories = item.ticketCategories.map((category) => ({
        ...category,
        availableQuantity: hasBooking
          ? Math.min(category.totalQuantity, previousAvailability.get(category.name) ?? category.totalQuantity)
          : category.totalQuantity,
      }));

      const event =
        await Event.findOneAndUpdate(
          {
            slug:
              item.slug,
          },

          {
            $set: {
              name:
                item.name,

              slug:
                item.slug,

              description:
                item.description,

              poster:
                item.poster,

              banner:
                item.banner,

              category:
                item.category,

              date:
                item.date,

              startTime:
                item.startTime,

              endTime:
                item.endTime,

              venue:
                venue._id,

              location:
                item.location,

              city:
                item.city,

              organizer:
                item.organizer,

              ticketCategories:
                ticketCategories,

              status:
                item.status,
            },
          },

          {
            upsert:
              true,

            new:
              true,

            runValidators:
              true,
          }
        );

      if (existingEvent) eventsUpdated++;
      else eventsCreated++;
      if (hasBooking) eventsProtected++;

      console.log(
        `🎤 Event: ${event.name}`
      );
    }

    const seededMovieSlugs = moviesData.map((item) => makeSlug(item.title));
    const seededEventSlugs = eventsData.map((item) => item.slug);
    const seededMovies = await Movie.find({ slug: { $in: seededMovieSlugs }, status: 'ACTIVE' });
    const activeDemoScreens = await Screen.find({
      seedKey: { $regex: `^${DEMO_THEATRE_KEY}-screen-` },
      venue: demoVenue._id,
    });
    const demoShows = await Show.find({
      seedKey: { $in: demoShowKeys },
    }).populate('movie venue screen');
    const seededEvents = await Event.find({ slug: { $in: seededEventSlugs } }).populate('venue');

    if (seededMovies.length !== 4) {
      throw new Error(`Expected 4 active seeded movies; found ${seededMovies.length}.`);
    }
    if (activeDemoScreens.length < seededMovies.length) {
      throw new Error('A seeded movie does not have its own active demo screen.');
    }
    if (demoShows.length !== seededMovies.length * DEMO_SHOW_DAYS * showTimes.length) {
      throw new Error(`Expected ${seededMovies.length * DEMO_SHOW_DAYS * showTimes.length} demo shows; found ${demoShows.length}.`);
    }

    const movieShowCounts = new Map(seededMovies.map((movie) => [movie._id.toString(), 0]));
    let availableSeatCount = 0;
    for (const show of demoShows) {
      if (!show.movie || !show.venue || !show.screen || show.status !== 'ACTIVE') {
        throw new Error(`Demo show ${show._id} has a missing relationship or is inactive.`);
      }
      if (!movieShowCounts.has(show.movie._id.toString())) {
        throw new Error(`Demo show ${show._id} references an unseeded movie.`);
      }
      if (!show.venue._id.equals(demoVenue._id) || !show.screen.venue.equals(show.venue._id)) {
        throw new Error(`Demo show ${show._id} has mismatched venue/screen references.`);
      }
      if (show.showDate < show.movie.releaseDate) {
        throw new Error(`Demo show ${show._id} is scheduled before its movie release date.`);
      }
      if (show.seatStatus.length !== show.screen.seatLayout.length) {
        throw new Error(`Demo show ${show._id} does not have the full screen seat inventory.`);
      }
      for (const seat of show.seatStatus) {
        if (!seat.seatId || !seat.row || !Number.isInteger(seat.number) || !seat.seatType ||
            typeof seat.priceMultiplier !== 'number' || typeof seat.price !== 'number' || !seat.status) {
          throw new Error(`Demo show ${show._id} contains an incomplete seat record.`);
        }
        if (seat.status === 'AVAILABLE') availableSeatCount++;
      }
      movieShowCounts.set(show.movie._id.toString(), movieShowCounts.get(show.movie._id.toString()) + 1);
    }
    if ([...movieShowCounts.values()].some((count) => count < DEMO_SHOW_DAYS * showTimes.length)) {
      throw new Error('At least one seeded movie is missing its demo show schedule.');
    }
    if (seededEvents.length !== 2 || seededEvents.some((event) =>
      event.status !== 'ACTIVE' || !event.venue || event.venue.type !== 'EVENT_VENUE' ||
      !event.ticketCategories.length || event.ticketCategories.some((category) =>
        category.availableQuantity < 0 || category.availableQuantity > category.totalQuantity
      )
    )) {
      throw new Error('Expected two active, venue-linked events with valid ticket inventory.');
    }

    /* ========================================================
       SUMMARY
    ======================================================== */

    const cinemaVenues =
      venueDocs.filter(
        (item) =>
          item.type ===
          'CINEMA'
      );

    const eventVenues =
      venueDocs.filter(
        (item) =>
          item.type ===
          'EVENT_VENUE'
      );

    const cities = [
      ...new Set(
        venueDocs.map(
          (item) =>
            item.city
        )
      ),
    ];

    console.log('');
    console.log(
      '================================================'
    );
    console.log(
      '          ✅ CINEVERSE SEED COMPLETE'
    );
    console.log(
      '================================================'
    );

    console.log('');
    console.log(
      `🎬 Movies: ${moviesData.length}`
    );

    console.log(`Events verified: ${seededEvents.length} (created ${eventsCreated}, updated ${eventsUpdated}, preserved ${eventsProtected} with bookings).`);

    console.log(
      `🏢 Total venues: ${venueDocs.length}`
    );

    console.log(
      `🎦 Cinema venues: ${cinemaVenues.length}`
    );

    console.log(
      `🎪 Event venues: ${eventVenues.length}`
    );

    console.log(
      `🎞️ Screens: ${screenDocs.length}`
    );

    console.log(`Demo shows verified: ${demoShows.length} (created ${showsCreated}, updated ${showsUpdated}, seats preserved for ${showsProtected} with bookings).`);
    console.log(`Stale unbooked demo shows cancelled: ${staleShowsCancelled}.`);
    console.log(`Demo theatre: ${demoVenue.name}; dedicated screens: ${activeDemoScreens.length}.`);
    console.log(`Available demo seats: ${availableSeatCount}.`);

    console.log(
      `📍 Cities: ${cities.length}`
    );

    console.log('');

    console.log(
      'MOVIES'
    );

    moviesData.forEach(
      (movie) => {
        console.log(
          `  🎬 ${movie.title}`
        );
      }
    );

    console.log('');

    console.log(
      'EVENTS'
    );

    eventsData.forEach(
      (event) => {
        console.log(
          `  🎤 ${event.name}`
        );
      }
    );

    console.log('');

    console.log(
      'LOCATIONS'
    );

    cities.forEach(
      (city) => {
        console.log(
          `  📍 ${city}`
        );
      }
    );

    console.log('');

    console.log(
      '================================================'
    );
  } catch (error) {
    console.error('');
    console.error(
      '❌ CINEVERSE SEED ERROR'
    );

    console.error(
      error?.message ||
        error
    );

    if (
      error?.errors
    ) {
      console.error(
        error.errors
      );
    }

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log('');
    console.log(
      'MongoDB connection closed.'
    );
  }
};

seedData();
