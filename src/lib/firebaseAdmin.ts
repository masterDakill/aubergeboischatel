import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App;
let firebaseAuth: Auth;

/**
 * Initialize Firebase Admin SDK
 * Singleton pattern to prevent multiple initializations
 */
export function initFirebaseAdmin() {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
      })
    });
    firebaseAuth = getAuth(adminApp);
    console.log('✅ Firebase Admin initialized');
  } else {
    firebaseAuth = getAuth();
  }
  return firebaseAuth;
}

/**
 * Verify Firebase ID token
 * @param idToken Firebase ID token from client
 * @returns Decoded token with user information
 */
export async function verifyIdToken(idToken: string) {
  const auth = initFirebaseAdmin();
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by UID
 * @param uid Firebase user UID
 * @returns User record
 */
export async function getUserByUid(uid: string) {
  const auth = initFirebaseAdmin();
  try {
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}

/**
 * Set custom claims for a user (for role management)
 * @param uid Firebase user UID
 * @param claims Custom claims object
 */
export async function setCustomClaims(uid: string, claims: object) {
  const auth = initFirebaseAdmin();
  try {
    await auth.setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error('Set custom claims error:', error);
    throw error;
  }
}
