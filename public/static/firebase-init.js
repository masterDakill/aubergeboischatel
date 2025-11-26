(function () {
  /**
   * Ensure Firebase is initialized once per page.
   * Returns an object { ok: boolean, reason?: string } for diagnostics.
   */
  function ensureFirebaseInitialized() {
    if (!window.firebase) {
      console.error('❌ Firebase SDK not loaded');
      return { ok: false, reason: 'sdk-missing' };
    }

    if (window.firebase.apps && window.firebase.apps.length > 0) {
      window.firebaseAppInitialized = true;
      return { ok: true };
    }

    const env = window.ENV || {};
    const requiredKeys = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_APP_ID'
    ];

    const missing = requiredKeys.filter((key) => !env[key]);
    if (missing.length) {
      console.error('❌ Missing Firebase config keys:', missing.join(', '));
      window.firebaseInitError = `Configuration Firebase incomplète: ${missing.join(', ')}`;
      return { ok: false, reason: 'config-missing' };
    }

    try {
      firebase.initializeApp({
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID
      });
      window.firebaseAppInitialized = true;
      console.info('✅ Firebase initialized (compat)');
      return { ok: true };
    } catch (error) {
      console.error('❌ Firebase init failed:', error);
      window.firebaseInitError = error?.message || 'Initialisation Firebase impossible';
      return { ok: false, reason: 'init-error' };
    }
  }

  window.ensureFirebaseInitialized = ensureFirebaseInitialized;

  // Auto-init on load to catch config issues early.
  if (!window.firebaseAppInitialized) {
    ensureFirebaseInitialized();
  }
})();
