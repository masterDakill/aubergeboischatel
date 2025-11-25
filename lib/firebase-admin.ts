/**
 * Firebase Admin Configuration
 * L'Auberge Boischatel - Server-Side Authentication
 * 
 * This file initializes Firebase Admin SDK for server-side operations
 * Used in: API routes for token verification, user management
 * 
 * IMPORTANT: Never import this file in client-side code
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminAuth: Auth;

/**
 * Initialize Firebase Admin SDK
 * Only runs on server-side (API routes, middleware)
 */
export function initAdmin() {
  if (getApps().length === 0) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          // Replace escaped newlines in private key
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
      
      adminAuth = getAuth(adminApp);
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error);
      throw error;
    }
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
  }
  
  return { adminApp, adminAuth };
}

/**
 * Verify Firebase ID token
 * @param idToken - Firebase ID token from client
 * @returns Decoded token with user info
 */
export async function verifyIdToken(idToken: string) {
  const { adminAuth } = initAdmin();
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by Firebase UID
 * @param uid - Firebase user UID
 * @returns Firebase user record
 */
export async function getUserByUid(uid: string) {
  const { adminAuth } = initAdmin();
  
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Get user by UID failed:', error);
    throw new Error('User not found');
  }
}

/**
 * Create custom claims for user (e.g., role)
 * @param uid - Firebase user UID
 * @param claims - Custom claims object
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>) {
  const { adminAuth } = initAdmin();
  
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    console.log(`✅ Custom claims set for user ${uid}`);
  } catch (error) {
    console.error('Set custom claims failed:', error);
    throw error;
  }
}

export { adminAuth };
