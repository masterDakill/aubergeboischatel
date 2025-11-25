/**
 * Firebase Client Configuration
 * This file exports the Firebase config object for client-side initialization
 * 
 * Environment variables must be prefixed with NEXT_PUBLIC_ to be accessible in browser
 * These are injected at build time and embedded in the client bundle
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

/**
 * Generate environment variables injection script for HTML
 * This is used in the main HTML to inject Firebase config into window.ENV
 */
export function getEnvScript() {
  return `
    window.ENV = {
      FIREBASE_API_KEY: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
      FIREBASE_AUTH_DOMAIN: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
      FIREBASE_PROJECT_ID: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
      FIREBASE_STORAGE_BUCKET: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
      FIREBASE_MESSAGING_SENDER_ID: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
      FIREBASE_APP_ID: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}"
    };
  `;
}
