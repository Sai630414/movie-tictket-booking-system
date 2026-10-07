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

    // Direct support for development/testing mock tokens
    if (token.startsWith('mock_jwt_')) {
      const mockRole = token.includes('admin') ? 'admin' : 'user';
      const mockSubId = token.replace('mock_jwt_', '');
      let dbUser = await User.findOne({
        $or: [
          { supabaseUserId: mockSubId },
          { email: token.includes('admin') ? 'admin@cineverse.com' : `${mockSubId}@example.com` },
        ],
      });
      if (!dbUser) {
        dbUser = await User.create({
          supabaseUserId: mockSubId,
          email: token.includes('admin') ? 'admin@cineverse.com' : `${mockSubId}@example.com`,
          name: mockRole === 'admin' ? 'System Admin' : mockSubId.toUpperCase(),
          role: mockRole,
        });
      }
      req.supabaseUser = { id: mockSubId, email: dbUser.email };
      req.user = dbUser;
      return next();
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
        role: supabaseUser.user_metadata?.role === 'admin' ? 'admin' : 'user',
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
      if (token && token.startsWith('mock_jwt_')) {
        const mockSubId = token.replace('mock_jwt_', '');
        const dbUser = await User.findOne({
          $or: [
            { supabaseUserId: mockSubId },
            { email: token.includes('admin') ? 'admin@cineverse.com' : `${mockSubId}@example.com` },
          ],
        });
        if (dbUser) {
          req.supabaseUser = { id: mockSubId, email: dbUser.email };
          req.user = dbUser;
          return next();
        }
      }
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
