import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
dotenv.config();

import { User } from '../src/models/User.js';
import { Movie } from '../src/models/Movie.js';
import { Event } from '../src/models/Event.js';
import { Venue } from '../src/models/Venue.js';
import { Screen } from '../src/models/Screen.js';
import { Show } from '../src/models/Show.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_event_booking';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Clear existing data and stale indexes
    try {
      await mongoose.connection.dropDatabase();
      console.log('Database dropped and fresh collections initialized.');
    } catch (err) {
      console.log('Clearing records via deleteMany fallback...');
      await User.deleteMany({});
      await Movie.deleteMany({});
      await Event.deleteMany({});
      await Venue.deleteMany({});
      await Screen.deleteMany({});
      await Show.deleteMany({});
    }

    // Sync indexes
    await Movie.syncIndexes();
    await Event.syncIndexes();

    // 1. Seed Users
    const adminUser = await User.create({
      supabaseUserId: 'admin-supabase-uid-123',
      email: 'admin@cineverse.com',
      name: 'System Admin',
      phone: '+91 9876543210',
      role: 'admin',
      city: 'Mumbai',
    });

    const regularUser = await User.create({
      supabaseUserId: 'user-supabase-uid-456',
      email: 'alex@example.com',
      name: 'Alex Johnson',
      phone: '+91 9876543211',
      role: 'user',
      city: 'Mumbai',
    });

    console.log('Users seeded.');

    // 2. Seed Movies
    const moviesData = [
      {
        title: 'Cyberpulse: Neo Tokyo 2099',
        description: 'In a dystopian future, a rogue hacker discovers a hidden code that can rewire human consciousness, triggering a city-wide war between artificial intelligence conglomerates.',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
        backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        genre: ['Sci-Fi', 'Action', 'Thriller'],
        language: 'English',
        duration: 148,
        rating: 8.9,
        cast: ['Ethan Vance', 'Kaelen Miller', 'Sophia Lin'],
        director: 'Marcus Thorne',
        releaseDate: new Date('2026-09-15'),
        releaseType: 'NEW_RELEASE',
        formats: ['2D', '3D', 'IMAX 3D'],
        certification: 'UA',
      },
      {
        title: 'Interstellar Odyssey: Beyond Time',
        description: 'A team of explorers travel through a newly discovered wormhole in search of humanity’s next home before earth succumbs to an environmental catastrophe.',
        poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop',
        backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        language: 'English',
        duration: 165,
        rating: 9.2,
        cast: ['Matthew Cooper', 'Anne Hathaway', 'Jessica Chastain'],
        director: 'Christopher Nolan',
        releaseDate: new Date('2026-10-01'),
        releaseType: 'NEW_RELEASE',
        formats: ['IMAX 2D', '3D'],
        certification: 'U',
      },
      {
        title: 'Shadows of the Dynasty',
        description: 'An epic martial arts drama set in ancient Asia, following a disgraced general fighting for his kingdom’s survival against impossible odds.',
        poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop',
        backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        genre: ['Action', 'History', 'Drama'],
        language: 'Hindi',
        duration: 152,
        rating: 8.4,
        cast: ['Ranveer Singh', 'Deepika Padukone', 'Sanjay Dutt'],
        director: 'Sanjay Leela Bhansali',
        releaseDate: new Date('2026-08-20'),
        releaseType: 'NEW_RELEASE',
        formats: ['2D', '3D'],
        certification: 'UA',
      },
      {
        title: 'Chronicles of Valhalla',
        description: 'A Viking prince embarks on a relentless quest across frozen lands to avenge his father’s murder and reclaim his rightful kingdom.',
        poster: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800&auto=format&fit=crop',
        backdrop: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        genre: ['Action', 'Fantasy'],
        language: 'English',
        duration: 135,
        rating: 8.1,
        cast: ['Alexander Skarsgård', 'Anya Taylor-Joy', 'Nicole Kidman'],
        director: 'Robert Eggers',
        releaseDate: new Date('2026-11-10'),
        releaseType: 'COMING_SOON',
        formats: ['2D', '4DX'],
        certification: 'A',
      },
    ];

    const movies = [];
    for (const mData of moviesData) {
      const slug = slugify(mData.title, { lower: true, strict: true });
      const movie = await Movie.create({ ...mData, slug });
      movies.push(movie);
    }
    console.log(`${movies.length} Movies seeded.`);

    // 3. Seed Venues
    const venue1 = await Venue.create({
      name: 'PVR ICON Gold Class',
      type: 'CINEMA',
      address: 'Phoenix Palladium Mall, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 18.995,
      longitude: 72.825,
      description: 'Luxury cinema experience with recliner seating and gourmet dining.',
      amenities: ['Recliner Seats', 'Dolby Atmos', '4K Projection', 'Food Court', 'Valet Parking'],
      totalCapacity: 120,
    });

    const venue2 = await Venue.create({
      name: 'INOX Megaplex',
      type: 'CINEMA',
      address: 'Inorbit Mall, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.174,
      longitude: 72.836,
      description: 'State of the art megaplex featuring IMAX 3D screen.',
      amenities: ['IMAX 3D', 'Dolby Atmos', '4DX', 'Wheelchair Accessible'],
      totalCapacity: 150,
    });

    const eventVenue = await Venue.create({
      name: 'Jio World Garden Stadium',
      type: 'EVENT_VENUE',
      address: 'Bandra Kurla Complex (BKC)',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.065,
      longitude: 72.868,
      description: 'Premier open-air arena for international concerts and grand festivals.',
      amenities: ['Open Air Arena', 'VIP Lounge', 'Food Stalls', 'Security Guarded'],
      totalCapacity: 5000,
    });

    console.log('Venues seeded.');

    // 4. Seed Screens for Cinemas
    const rows = 8;
    const columns = 10;
    const seatLayout = [];
    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let r = 0; r < rows; r++) {
      const rowChar = rowLetters[r];
      let seatType = 'REGULAR';
      let priceMultiplier = 1.0;

      if (r >= 6) {
        seatType = 'RECLINER';
        priceMultiplier = 1.6;
      } else if (r >= 4) {
        seatType = 'VIP';
        priceMultiplier = 1.3;
      } else if (r >= 2) {
        seatType = 'PREMIUM';
        priceMultiplier = 1.15;
      }

      for (let c = 1; c <= columns; c++) {
        seatLayout.push({
          row: rowChar,
          number: c,
          seatType,
          priceMultiplier,
          status: 'ACTIVE',
        });
      }
    }

    const screen1 = await Screen.create({
      venue: venue1._id,
      name: 'Screen 1 (IMAX 3D)',
      rows,
      columns,
      totalSeats: rows * columns,
      seatLayout,
    });

    const screen2 = await Screen.create({
      venue: venue2._id,
      name: 'Screen A (Dolby Atmos)',
      rows,
      columns,
      totalSeats: rows * columns,
      seatLayout,
    });

    console.log('Screens seeded.');

    // 5. Seed Shows
    const showDates = [
      new Date('2026-10-07'),
      new Date('2026-10-08'),
      new Date('2026-10-09'),
    ];

    const times = ['10:30 AM', '02:15 PM', '06:45 PM', '10:00 PM'];

    for (const sDate of showDates) {
      for (const time of times) {
        const basePrice = 250;
        const seatStatus = screen1.seatLayout.map((seat) => ({
          seatId: `${seat.row}${seat.number}`,
          row: seat.row,
          number: seat.number,
          seatType: seat.seatType,
          priceMultiplier: seat.priceMultiplier,
          price: Math.round(basePrice * seat.priceMultiplier),
          status: 'AVAILABLE',
        }));

        await Show.create({
          movie: movies[0]._id,
          venue: venue1._id,
          screen: screen1._id,
          showDate: sDate,
          startTime: time,
          language: movies[0].language,
          format: 'IMAX 3D',
          basePrice,
          seatStatus,
        });

        const seatStatus2 = screen2.seatLayout.map((seat) => ({
          seatId: `${seat.row}${seat.number}`,
          row: seat.row,
          number: seat.number,
          seatType: seat.seatType,
          priceMultiplier: seat.priceMultiplier,
          price: Math.round(200 * seat.priceMultiplier),
          status: 'AVAILABLE',
        }));

        await Show.create({
          movie: movies[1]._id,
          venue: venue2._id,
          screen: screen2._id,
          showDate: sDate,
          startTime: time,
          language: movies[1].language,
          format: '2D',
          basePrice: 200,
          seatStatus: seatStatus2,
        });
      }
    }

    console.log('Shows seeded.');

    // 6. Seed Events
    const eventsData = [
      {
        name: 'Acoustic Symphony Live: World Tour 2026',
        description: 'Experience an enchanting night of live orchestral rock melodies performed by world-renowned instrumentalists.',
        poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop',
        category: 'Concert',
        date: new Date('2026-10-25'),
        startTime: '07:00 PM',
        endTime: '11:00 PM',
        venue: eventVenue._id,
        location: 'BKC Open Grounds',
        city: 'Mumbai',
        organizer: 'Cineverse Live Productions',
        ticketCategories: [
          { name: 'VIP Front Stage', price: 2999, totalQuantity: 100, availableQuantity: 100 },
          { name: 'Gold Fan Pit', price: 1499, totalQuantity: 300, availableQuantity: 300 },
          { name: 'General Admission', price: 799, totalQuantity: 1000, availableQuantity: 1000 },
        ],
      },
      {
        name: 'The Ultimate Standup Comedy Arena',
        description: 'Prepare for non-stop laughter as top tier comedians take the stage for 3 full hours of unscripted comedic mayhem.',
        poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop',
        category: 'Comedy',
        date: new Date('2026-11-05'),
        startTime: '08:00 PM',
        endTime: '10:30 PM',
        venue: eventVenue._id,
        location: 'Hall B Arena',
        city: 'Mumbai',
        organizer: 'Laugh Factory India',
        ticketCategories: [
          { name: 'Front Row VIP', price: 1999, totalQuantity: 50, availableQuantity: 50 },
          { name: 'Standard Seat', price: 999, totalQuantity: 400, availableQuantity: 400 },
        ],
      },
    ];

    for (const eData of eventsData) {
      const slug = slugify(eData.name, { lower: true, strict: true });
      await Event.create({ ...eData, slug });
    }

    console.log('Events seeded.');
    console.log('Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
