import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';

dotenv.config();

const ADMIN_EMAILS = [
  'sai.23mic7189@vitapstudent.ac.in',
  'raviteja.23mic7059@vitapstudent.ac.in',
];

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_event_booking';
const isLocalMongo = /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(MONGODB_URI);

const seedAdmins = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to promote demo admin accounts in production.');
  }
  if (!isLocalMongo && process.env.ALLOW_REMOTE_ADMIN_SEED !== 'true') {
    throw new Error('Remote admin promotion is disabled. Set ALLOW_REMOTE_ADMIN_SEED=true only for a verified development database.');
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  const profiles = await User.find({ email: { $in: ADMIN_EMAILS } }).select('email role').lean();
  const foundEmails = new Set(profiles.map(profile => profile.email));
  const missingEmails = ADMIN_EMAILS.filter(email => !foundEmails.has(email));
  if (missingEmails.length) {
    throw new Error(`No CineVerse profile exists yet for: ${missingEmails.join(', ')}. Create each account in Supabase and sign in once before promoting it.`);
  }

  const result = await User.updateMany(
    { email: { $in: ADMIN_EMAILS } },
    { $set: { role: 'admin' } }
  );
  console.log(`Admin profiles verified: ${result.matchedCount}; promoted: ${result.modifiedCount}.`);
};

seedAdmins()
  .catch(error => {
    console.error(`[Admin seed failed] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
