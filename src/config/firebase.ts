/**
 * Firebase Configuration
 * 
 * PHASE 2 UI-ONLY MODE: Firebase completely disabled
 */

// #region agent log
console.log('[DEBUG-A] firebase.ts module loading START');
// #endregion

// PHASE 3A: Firebase imports enabled
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence,
  Auth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// FIREBASE CONFIGURATION
// =============================================================================

/**
 * Firebase project configuration.
 * Replace these values with your own Firebase project credentials.
 * 
 * For production, use environment variables:
 * apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// =============================================================================
// PHASE 2: UI-ONLY MODE - FIREBASE COMPLETELY DISABLED
// =============================================================================

/**
 * PHASE 3A: Firebase is now enabled for authentication and backend services.
 * Set to false to use real Firebase, true to use mock data.
 */

const PHASE_2_UI_ONLY_MODE = false;

// Check if Firebase is properly configured
const isFirebaseConfigured = 
  !PHASE_2_UI_ONLY_MODE &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

// =============================================================================
// FIREBASE INITIALIZATION
// =============================================================================

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured && !PHASE_2_UI_ONLY_MODE) {
  // Initialize Firebase only if properly configured AND not in Phase 2 mode
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // If auth is already initialized (hot reload), get existing instance
    auth = getAuth(app);
  }

  firestore = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase initialized successfully');
} else {
  // Phase 2 UI-only mode - Firebase completely disabled
  console.log('⚠️ Firebase NOT initialized - check environment variables or PHASE_2_UI_ONLY_MODE flag');
  app = null;
  auth = null;
  firestore = null;
  storage = null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { app, auth, firestore, storage };
export default app;

