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

const makeSeatLayout = (capacity, theatreIndex, screenNumber) => {
  const columns = 8 + (theatreIndex % 16);
  const rows = Math.ceil(capacity / columns);
  const premiumRows = Math.min(rows - 1, 1 + Math.floor(theatreIndex / 16));
  const reclinerRows = Math.min(rows - premiumRows, 1 + (screenNumber % 2));

  return Array.from({ length: capacity }, (_, index) => {
    const row = Math.floor(index / columns);

    let seatType = 'STANDARD';
    let priceMultiplier = 1;

    if (row >= rows - reclinerRows) {
      seatType = 'RECLINER';
      priceMultiplier = 1.8;
    } else if (row >= rows - reclinerRows - premiumRows) {
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

    duration: 144,

    director: 'Destin Daniel Cretton',

    cast: ['Tom Holland', 'Zendaya', 'Sadie Sink', 'Mark Ruffalo'],

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

    date: '2026-09-24',

    language: 'Telugu',

    duration: 174,

    director: 'Srikanth Odela',

    cast: ['Nani', 'Mohan Babu', 'Kayadu Lohar', 'Raghav Juyal', 'Sonali Kulkarni'],

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

    date: '2025-12-05',

    language: 'Hindi',

    duration: 214,

    director: 'Aditya Dhar',

    cast: ['Ranveer Singh', 'Akshaye Khanna', 'Sanjay Dutt', 'R. Madhavan', 'Arjun Rampal'],

    genre: [
      'Action',
      'Thriller',
      'Drama',
    ],

    certification: 'A',

    description:
      'A high-intensity action thriller.',

    poster:
      'https://upload.wikimedia.org/wikipedia/en/6/6f/Dhurandhar_film_poster.jpg',

    backdrop:
      'https://assets-in.bmscdn.com/discovery-catalog/events/et00478890-rpenrjddmy-landscape.jpg',

    trailerUrl:
      'https://www.youtube.com/watch?v=BKOVzHcjEIo',

    trailer: {
      provider: 'youtube',

      videoId: 'BKOVzHcjEIo',

      url: 'https://www.youtube.com/watch?v=BKOVzHcjEIo',

      title: 'Dhurandhar Official Trailer',

      thumbnailUrl: 'https://i.ytimg.com/vi/BKOVzHcjEIo/hqdefault.jpg',
    },

    releaseType: 'CATALOG',
  },

  {
    title: 'Bethlehem Kudumba Unit',

    date: '2026-08-21',

    language: 'Malayalam',

    duration: 157,

    director: 'Girish A. D.',

    cast: ['Nivin Pauly', 'Mamitha Baiju', 'Sangeeth Prathap', 'Srinda'],

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

    active: true,

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

    active: true,

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

    active: true,

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

    active: true,

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

  // Clearly labelled demo cinemas for cities exposed by frontend CityContext.
  ...[
    ['anantapur-demo-theatre', 'Anantapur'],
    ['eluru-demo-theatre', 'Eluru'],
    ['ongole-demo-theatre', 'Ongole'],
    ['machilipatnam-demo-theatre', 'Machilipatnam'],
    ['srikakulam-demo-theatre', 'Srikakulam'],
    ['vizianagaram-demo-theatre', 'Vizianagaram'],
    ['bhimavaram-demo-theatre', 'Bhimavaram'],
  ].map(([key, city]) => ({
    key,
    name: `CineVerse ${city} Demo Theatre`,
    chain: 'CineVerse Demo',
    city,
    address: `${city}, Andhra Pradesh (demo venue)`,
    capacity: 120,
    screens: 3,
    active: true,
    type: 'CINEMA',
  })),
];

/* ============================================================
   SHOW DATES
============================================================ */

const SHOW_DATE_KEYS = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'];
const DAILY_SHOW_TIMES = ['10:00 AM', '02:00 PM', '06:00 PM'];
const SHOW_DURATION_MINUTES = 150;
const SCREEN_CLEANING_MINUTES = 30;
const DEMO_THEATRE_KEY = 'cineverse-demo-theatre';
const SHOW_KEY_PREFIX = 'cineverse-show-2026-11-';
const LEGACY_DEMO_SHOW_KEY_PREFIX = 'cineverse-demo-show-';

const datePartsInKolkata = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

const timeInKolkata = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === 'hour').value) * 60
    + Number(parts.find((part) => part.type === 'minute').value);
};

const formatShowTime = (minutes) => {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const showDateAtKolkataNoon = (dateKey) => new Date(`${dateKey}T06:30:00.000Z`);

const showTimeToMinutes = (time) => {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) throw new Error(`Invalid seeded show time: ${time}`);
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return hour * 60 + Number(match[2]);
};

const showTimeTo24Hour = (time) => {
  const minutes = showTimeToMinutes(time);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

const scheduledStartDate = (dateKey, time) => new Date(`${dateKey}T${showTimeTo24Hour(time)}:00+05:30`);

const currentDayShowTimes = (now = new Date()) => {
  const first = Math.ceil((timeInKolkata(now) + 30) / 15) * 15;
  const times = [first, first + 15, first + 30];
  const latestEnd = Math.max(...moviesData.map((movie) => movie.duration || SHOW_DURATION_MINUTES)) + SCREEN_CLEANING_MINUTES;
  if (times.some((time) => time + latestEnd >= 24 * 60)) {
    throw new Error('Cannot fit three future show starts and their runtimes on today’s remaining schedule without changing the requested date range.');
  }
  return times.map(formatShowTime);
};

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

    const seedStartedAt = new Date();
    const todayInKolkata = datePartsInKolkata(seedStartedAt);
    if (todayInKolkata > SHOW_DATE_KEYS[SHOW_DATE_KEYS.length - 1] || SHOW_DATE_KEYS.some((dateKey) => dateKey < todayInKolkata)) {
      throw new Error(`The fixed show range ${SHOW_DATE_KEYS[0]} through ${SHOW_DATE_KEYS.at(-1)} cannot all be seeded as future shows today (${todayInKolkata}, Asia/Kolkata). No database records were changed.`);
    }
    const dailyTimes = new Map(SHOW_DATE_KEYS.map((dateKey) => [
      dateKey,
      dateKey === todayInKolkata ? currentDayShowTimes(seedStartedAt) : DAILY_SHOW_TIMES,
    ]));
    for (const [dateKey, times] of dailyTimes) {
      if (times.some((time) => scheduledStartDate(dateKey, time) <= seedStartedAt)) {
        throw new Error(`The requested show range contains a show that would not be in the future: ${dateKey} ${times.join(', ')}.`);
      }
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
    let moviesCreated = 0;
    let moviesUpdated = 0;

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

      const existingMovie = await Movie.exists({ slug: movieSlug });
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
      if (existingMovie) moviesUpdated++;
      else moviesCreated++;

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
    let venuesCreated = 0;
    let venuesUpdated = 0;

    for (const item of venuesData) {
      const existingVenue = await Venue.exists({ seedKey: item.key });
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

              totalCapacity: item.capacity * (item.key === DEMO_THEATRE_KEY ? 7 : Math.max(3, item.screens)),

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
      if (existingVenue) venuesUpdated++;
      else venuesCreated++;

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
    let screensCreated = 0;
    let screensUpdated = 0;
    let screensProtected = 0;
    let theatreIndex = 0;

    for (const item of venueDocs) {
      if (
        item.type !==
        'CINEMA'
      ) {
        continue;
      }

      if (!item.active) continue;
      const currentTheatreIndex = theatreIndex++;

      const screenCount = item.key === DEMO_THEATRE_KEY
        ? 7
        : Math.max(3, Math.min(item.screens, 4));

      for (
        let screenNumber = 1;
        screenNumber <=
        screenCount;
        screenNumber++
      ) {
        const seedKey =
          `${item.key}-screen-${screenNumber}`;

        const seatLayout = makeSeatLayout(item.capacity, currentTheatreIndex, screenNumber);
        const existingScreen = await Screen.findOne({ seedKey });
        const screenShowIds = existingScreen
          ? await Show.find({ screen: existingScreen._id }).distinct('_id')
          : [];
        const screenHasBookings = screenShowIds.length
          ? Boolean(await Booking.exists({ show: { $in: screenShowIds } }))
          : false;
        if (screenHasBookings) screensProtected++;
        else if (existingScreen) screensUpdated++;
        else screensCreated++;
        const screen = screenHasBookings
          ? existingScreen
          : await Screen.findOneAndUpdate(
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

                rows: Math.ceil(item.capacity / (8 + (currentTheatreIndex % 16))),

                columns: 8 + (currentTheatreIndex % 16),

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
       Three screenings per theatre and assigned movie for each requested date.
    ======================================================== */

    const activeCinemaVenues = venueDocs.filter((item) => item.type === 'CINEMA' && item.venue.status === 'ACTIVE');
    const scheduleByVenue = new Map();
    let showsCreated = 0;
    let showsUpdated = 0;
    let showsProtected = 0;
    const seededShowKeys = [];
    let venueIndex = 0;

    for (const venueInfo of activeCinemaVenues) {
      const venueScreens = screenDocs
        .filter(({ venue }) => venue.key === venueInfo.key)
        .sort((a, b) => a.screen.name.localeCompare(b.screen.name));
      if (venueScreens.length < 3) throw new Error(`${venueInfo.name} needs at least three active screens for the requested show schedule.`);
      const scheduleScreens = venueInfo.key === DEMO_THEATRE_KEY ? venueScreens.slice(-3) : venueScreens.slice(0, 3);

      const movieIndex = venueIndex % moviesData.length;
      const movie = movieDocs.get(moviesData[movieIndex].title);
      if (!movie || movie.status !== 'ACTIVE' || venueInfo.venue.status !== 'ACTIVE') {
        throw new Error(`Missing active movie or theatre records for ${venueInfo.name}.`);
      }
      const venueDailyCounts = new Map();

      for (const dateKey of SHOW_DATE_KEYS) {
        const showDate = showDateAtKolkataNoon(dateKey);
        if (showDate < movie.releaseDate) throw new Error(`${movie.title} is scheduled before its release date at ${venueInfo.name}.`);
        const times = dailyTimes.get(dateKey);
        for (let timeIndex = 0; timeIndex < times.length; timeIndex++) {
          const time = times[timeIndex];
          const { screen } = scheduleScreens[timeIndex];
          const basePrice = 150 + movieIndex * 20;
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
          const seedKey = `${SHOW_KEY_PREFIX}${venueInfo.key}-${movie.slug}-${dateKey}-${timeKey}`;
          seededShowKeys.push(seedKey);
          const existingShow = await Show.findOne({ seedKey }).select('_id');
          const hasBooking = existingShow ? Boolean(await Booking.exists({ show: existingShow._id })) : false;
          const endTime = formatShowTime(showTimeToMinutes(time) + (movie.duration || SHOW_DURATION_MINUTES));
          const result = await Show.updateOne({ seedKey }, {
            $set: {
              movie: movie._id,
              venue: venueInfo.venue._id,
              screen: screen._id,
              showDate,
              startTime: time,
              endTime,
              language: movie.language,
              format: '2D',
              basePrice,
              status: 'ACTIVE',
              ...(hasBooking ? {} : { seatStatus }),
            },
            $setOnInsert: { seedKey },
          }, { upsert: true, runValidators: true });
          if (result.upsertedCount) showsCreated++;
          else showsUpdated++;
          if (hasBooking) showsProtected++;
          venueDailyCounts.set(dateKey, (venueDailyCounts.get(dateKey) || 0) + 1);
        }
      }
      scheduleByVenue.set(venueInfo.key, { movie, counts: venueDailyCounts });
      venueIndex++;
    }

    const staleSeededShows = await Show.find({
      $or: [
        { seedKey: { $regex: `^${SHOW_KEY_PREFIX}`, $nin: seededShowKeys } },
        { seedKey: { $regex: `^${LEGACY_DEMO_SHOW_KEY_PREFIX}` } },
      ],
      status: 'ACTIVE',
    }).select('_id');
    let staleShowsCancelled = 0;
    for (const staleShow of staleSeededShows) {
      if (!(await Booking.exists({ show: staleShow._id }))) {
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
    const scheduledShows = await Show.find({ seedKey: { $in: seededShowKeys } }).populate('movie venue screen');
    const seededEvents = await Event.find({ slug: { $in: seededEventSlugs } }).populate('venue');

    if (seededMovies.length !== moviesData.length) throw new Error(`Expected ${moviesData.length} active seeded movies; found ${seededMovies.length}.`);
    const expectedShowCount = activeCinemaVenues.length * SHOW_DATE_KEYS.length * DAILY_SHOW_TIMES.length;
    if (scheduledShows.length !== expectedShowCount) throw new Error(`Expected ${expectedShowCount} scheduled shows; found ${scheduledShows.length}.`);

    const showCountsByVenueDay = new Map();
    const seenShowSlots = new Set();
    const showIntervalsByScreen = new Map();
    let availableSeatCount = 0;
    const layoutSignatures = new Map();
    for (const venueInfo of activeCinemaVenues) {
      const primaryScreen = screenDocs.find(({ venue, screen }) => venue.key === venueInfo.key && screen.name === 'Screen 1')?.screen;
      if (!primaryScreen) throw new Error(`${venueInfo.name} has no seeded screen.`);
      const signature = `${primaryScreen.columns}|${primaryScreen.seatLayout.map((seat) => `${seat.seatType}:${seat.priceMultiplier}`).join(',')}`;
      if ([...layoutSignatures.values()].includes(signature)) throw new Error(`Seating layout is not unique for ${venueInfo.name}.`);
      layoutSignatures.set(venueInfo.key, signature);
    }

    for (const show of scheduledShows) {
      if (!show.movie || !show.venue || !show.screen || show.status !== 'ACTIVE') throw new Error(`Show ${show._id} has a missing relationship or is inactive.`);
      if (!show.screen.venue.equals(show.venue._id)) throw new Error(`Show ${show._id} has mismatched venue and screen references.`);
      const dateKey = datePartsInKolkata(show.showDate);
      if (!SHOW_DATE_KEYS.includes(dateKey)) throw new Error(`Show ${show._id} falls outside the requested date range.`);
      if (show.showDate < show.movie.releaseDate) throw new Error(`Show ${show._id} is scheduled before its movie release date.`);
      const start = scheduledStartDate(dateKey, show.startTime);
      if (start <= new Date()) throw new Error(`Show ${show._id} is no longer in the future.`);

      const slotKey = `${show.screen._id}|${dateKey}|${show.startTime}`;
      if (seenShowSlots.has(slotKey)) throw new Error(`Duplicate show slot detected: ${slotKey}.`);
      seenShowSlots.add(slotKey);
      const screenDayKey = `${show.screen._id}|${dateKey}`;
      const interval = { start: start.getTime(), end: start.getTime() + ((show.movie.duration || SHOW_DURATION_MINUTES) + SCREEN_CLEANING_MINUTES) * 60_000 };
      const intervals = showIntervalsByScreen.get(screenDayKey) || [];
      if (intervals.some((existing) => interval.start < existing.end && interval.end > existing.start)) throw new Error(`Screen schedule overlaps on ${dateKey} at ${show.screen.name}.`);
      intervals.push(interval);
      showIntervalsByScreen.set(screenDayKey, intervals);

      const venueDayKey = `${show.venue._id}|${show.movie._id}|${dateKey}`;
      showCountsByVenueDay.set(venueDayKey, (showCountsByVenueDay.get(venueDayKey) || 0) + 1);
      if (show.seatStatus.length !== show.screen.seatLayout.length) throw new Error(`Show ${show._id} is missing its screen's seats.`);
      const seatIds = new Set();
      for (const seat of show.seatStatus) {
        if (!seat.seatId || !seat.row || !Number.isInteger(seat.number) || !seat.seatType || typeof seat.priceMultiplier !== 'number' || typeof seat.price !== 'number' || !seat.status) {
          throw new Error(`Show ${show._id} contains an incomplete seat record.`);
        }
        if (seatIds.has(seat.seatId)) throw new Error(`Show ${show._id} has duplicate seat IDs.`);
        seatIds.add(seat.seatId);
        if (seat.status === 'AVAILABLE') availableSeatCount++;
      }
    }

    for (const venueInfo of activeCinemaVenues) {
      const schedule = scheduleByVenue.get(venueInfo.key);
      for (const dateKey of SHOW_DATE_KEYS) {
        const count = schedule?.counts.get(dateKey) || 0;
        if (count < DAILY_SHOW_TIMES.length) throw new Error(`${venueInfo.name} has fewer than three shows on ${dateKey}.`);
        const key = `${venueInfo.venue._id}|${schedule.movie._id}|${dateKey}`;
        if ((showCountsByVenueDay.get(key) || 0) < 3) throw new Error(`${venueInfo.name} is missing three shows on ${dateKey}.`);
      }
    }
    const seededScreens = await Screen.find({ seedKey: { $in: screenDocs.map(({ screen }) => screen.seedKey) } });
    if (seededScreens.length !== screenDocs.length) throw new Error('Some seeded screens are missing from MongoDB.');
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
      `🎬 Movies: ${moviesData.length} (inserted ${moviesCreated}, updated ${moviesUpdated}, skipped 0).`
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
      `🎞️ Screens: ${screenDocs.length} (inserted ${screensCreated}, updated ${screensUpdated}, preserved ${screensProtected} with bookings).`
    );

    console.log(`Venues: ${venueDocs.length} (inserted ${venuesCreated}, updated ${venuesUpdated}, skipped 0).`);
    console.log('Seed failures: 0.');

    console.log(`Movie shows verified: ${scheduledShows.length} (created ${showsCreated}, updated ${showsUpdated}, seat inventory preserved for ${showsProtected} booked shows).`);
    console.log(`Stale unbooked seed shows cancelled: ${staleShowsCancelled}.`);
    console.log(`Active cinema venues: ${activeCinemaVenues.length}; screens prepared: ${screenDocs.length}.`);
    console.log(`Available show seats: ${availableSeatCount}.`);
    console.log('Show counts by date and city:');
    for (const dateKey of SHOW_DATE_KEYS) {
      for (const city of [...new Set(activeCinemaVenues.map((venue) => venue.city))]) {
        const count = activeCinemaVenues.filter((venue) => venue.city === city)
          .reduce((total, venue) => total + (scheduleByVenue.get(venue.key)?.counts.get(dateKey) || 0), 0);
        console.log(`  ${dateKey} · ${city}: ${count}`);
      }
    }
    console.log('Seating styles by theatre:');
    for (const venue of activeCinemaVenues) {
      const firstScreen = screenDocs.find(({ venue: item, screen }) => item.key === venue.key && screen.name === 'Screen 1')?.screen;
      const styleCounts = firstScreen.seatLayout.reduce((counts, seat) => {
        counts[seat.seatType] = (counts[seat.seatType] || 0) + 1;
        return counts;
      }, {});
      console.log(`  ${venue.name}: ${firstScreen.rows} rows × ${firstScreen.columns} columns; ${Object.entries(styleCounts).map(([type, count]) => `${type} ${count}`).join(', ')}.`);
    }

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
