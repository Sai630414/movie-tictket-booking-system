import { supabaseAdmin } from '../config/supabase.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token missing or invalid format', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication token missing', 'UNAUTHORIZED', 401);
    }

    if (!supabaseAdmin) {
      return errorResponse(res, 'Authentication service is not configured', 'AUTH_UNAVAILABLE', 503);
    }

    // Verify token via Supabase Auth API
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      return errorResponse(res, 'Invalid or expired authentication session', 'UNAUTHORIZED', 401);
    }

    // Retrieve or create User document in MongoDB
    const metadata = supabaseUser.user_metadata || {};
    const email = typeof supabaseUser.email === 'string' && supabaseUser.email.trim()
      ? supabaseUser.email.trim().toLowerCase()
      : undefined;
    const profileUpdates = {
      ...(email ? { email } : {}),
      ...(supabaseUser.phone ? { phone: supabaseUser.phone } : {}),
      ...((metadata.name || metadata.full_name) ? { name: metadata.name || metadata.full_name } : {}),
      ...(metadata.city ? { city: metadata.city } : {}),
      ...(metadata.avatar_url ? { profileImage: metadata.avatar_url } : {}),
    };
    const dbUser = await User.findOneAndUpdate(
      { supabaseUserId: supabaseUser.id },
      {
        $set: profileUpdates,
        $setOnInsert: {
          supabaseUserId: supabaseUser.id,
          role: 'user',
          city: 'Vijayawada',
          preferredLanguage: 'Telugu',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    req.supabaseUser = supabaseUser;
    req.user = dbUser;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    return errorResponse(res, 'Authentication verification failed', 'AUTH_ERROR', 401);
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'User context not found', 'UNAUTHORIZED', 401);
  }

  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied: Admin privileges required', 'FORBIDDEN', 403);
  }

  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (!supabaseAdmin) return next();
      const { data: { user: supabaseUser } } = await supabaseAdmin.auth.getUser(token);
      if (supabaseUser) {
        const dbUser = await User.findOne({ supabaseUserId: supabaseUser.id });
        if (dbUser) {
          req.supabaseUser = supabaseUser;
          req.user = dbUser;
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};
