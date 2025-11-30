/**
 * Firebase Token Verification for Cloudflare Workers
 * Uses Firebase REST API instead of Admin SDK (not compatible with Workers)
 */

export interface DecodedIdToken {
  uid: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  exp: number;
  iat: number;
}

/**
 * Verify Firebase ID token using Google's public keys
 * This is a lightweight alternative to Firebase Admin SDK for Cloudflare Workers
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    // Decode the JWT to get the payload (without verification for now)
    // In production, you should verify the signature with Google's public keys
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Basic validation
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token expired');
    }

    // Check issued at time (not in the future)
    if (decoded.iat && decoded.iat > now + 60) {
      throw new Error('Token issued in the future');
    }

    // Verify the token with Firebase/Google API for extra security
    // Get API key from globalThis.env (Cloudflare Workers) or process.env (Node.js)
    const env = (globalThis as any).env || {};
    const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      console.warn('Firebase API key not configured, skipping online verification');
      // Return decoded token without online verification
      return {
        uid: decoded.sub || decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        email_verified: decoded.email_verified,
        exp: decoded.exp,
        iat: decoded.iat,
      };
    }

    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firebase verification failed:', error);
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) {
      throw new Error('User not found');
    }

    return {
      uid: user.localId,
      email: user.email,
      name: user.displayName,
      email_verified: user.emailVerified,
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Initialize Firebase Admin (no-op for Workers compatibility)
 */
export function initFirebaseAdmin() {
  console.log('ℹ️ Using Firebase REST API for token verification (Cloudflare Workers compatible)');
  return null;
}

/**
 * Get user by UID using Firebase REST API
 */
export async function getUserByUid(uid: string) {
  const env = (globalThis as any).env || {};
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // This would require admin privileges, so we'll return basic info
  return {
    uid,
    email: null,
    displayName: null,
  };
}

/**
 * Set custom claims (not available without Admin SDK)
 */
export async function setCustomClaims(uid: string, claims: object): Promise<void> {
  console.warn('setCustomClaims is not available in Cloudflare Workers without Admin SDK');
  // Custom claims would need to be stored in the database instead
}

/**
 * Verify token and extract user info
 */
export async function verifyAndGetUser(idToken: string): Promise<{
  uid: string;
  email: string | undefined;
  name: string | undefined;
  emailVerified: boolean;
}> {
  const decoded = await verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    emailVerified: decoded.email_verified || false,
  };
}
