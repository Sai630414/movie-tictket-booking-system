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
    let dbUser = await User.findOne({ supabaseUserId: supabaseUser.id });

    if (!dbUser) {
      dbUser = await User.create({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        phone: supabaseUser.user_metadata?.phone || '',
        // Roles are assigned only by trusted admin operations, never client metadata.
        role: 'user',
      });
    }

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
