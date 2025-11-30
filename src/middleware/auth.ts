/**
 * Authentication Middleware for Hono
 * Protects routes by verifying Firebase tokens and checking roles
 */

import { Context, Next } from 'hono';
import { verifyIdToken } from '../lib/firebaseAdmin';
import { query } from '../lib/db';

export type UserRole = 'CLIENT' | 'EMPLOYEE' | 'ADMIN';

export interface AuthUser {
  id: string;
  firebase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  active: boolean;
}

/**
 * Extract token from Authorization header or cookie
 */
function extractToken(c: Context): string | null {
  // Check Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookie = c.req.header('Cookie');
  if (cookie) {
    const match = cookie.match(/authToken=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Middleware to verify authentication
 * Adds user to context if authenticated
 */
export async function requireAuth(c: Context, next: Next) {
  const token = extractToken(c);

  if (!token) {
    return c.json({ error: 'Authentication required', code: 'NO_TOKEN' }, 401);
  }

  try {
    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);
    const { uid } = decodedToken;

    // Get user from database
    const userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found in database', code: 'USER_NOT_FOUND' }, 404);
    }

    const user = userResult.rows[0] as AuthUser;

    if (!user.active) {
      return c.json({ error: 'Account is disabled', code: 'ACCOUNT_DISABLED' }, 403);
    }

    // Add user to context
    c.set('user', user);
    c.set('userId', user.id);
    c.set('userRole', user.role);

    await next();
  } catch (error: any) {
    console.error('Auth middleware error:', error.message);
    return c.json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' }, 401);
  }
}

/**
 * Middleware to require specific roles
 * Must be used AFTER requireAuth
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;

    if (!user) {
      return c.json({ error: 'Authentication required', code: 'NO_USER' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({
        error: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: user.role
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware for CLIENT only routes
 */
export const requireClient = requireRole('CLIENT', 'EMPLOYEE', 'ADMIN');

/**
 * Middleware for EMPLOYEE routes (EMPLOYEE + ADMIN)
 */
export const requireEmployee = requireRole('EMPLOYEE', 'ADMIN');

/**
 * Middleware for ADMIN only routes
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Optional auth - doesn't block, just adds user to context if authenticated
 */
export async function optionalAuth(c: Context, next: Next) {
  const token = extractToken(c);

  if (token) {
    try {
      const decodedToken = await verifyIdToken(token);
      const { uid } = decodedToken;

      const userResult = await query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [uid]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0] as AuthUser;
        if (user.active) {
          c.set('user', user);
          c.set('userId', user.id);
          c.set('userRole', user.role);
        }
      }
    } catch (error) {
      // Silently ignore - user just won't be authenticated
    }
  }

  await next();
}
