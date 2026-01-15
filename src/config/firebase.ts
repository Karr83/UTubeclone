/**
 * Firebase Configuration
 * 
 * This file initializes Firebase services used throughout the app:
 * - Firebase Auth: User authentication
 * - Firestore: Database for user profiles and app data
 * - Firebase Storage: Media file uploads (images, videos)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project or select existing one
 * 3. Add a Web app to your project
 * 4. Copy the firebaseConfig values below
 * 5. Enable Email/Password authentication in Firebase Console
 * 6. Create Firestore database in Firebase Console
 * 7. Enable Firebase Storage in Firebase Console
 * 
 * SECURITY NOTE:
 * In production, use environment variables for these values.
 * Create a .env file with EXPO_PUBLIC_ prefix for Expo projects.
 */

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
// FIREBASE INITIALIZATION
// =============================================================================

/**
 * Initialize Firebase App.
 * Uses singleton pattern to prevent multiple initializations.
 */
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

/**
 * Initialize Firebase Auth with React Native persistence.
 * This ensures auth state persists across app restarts.
 */
let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If auth is already initialized (hot reload), get existing instance
  auth = getAuth(app);
}

/**
 * Initialize Firestore database.
 */
const firestore: Firestore = getFirestore(app);

/**
 * Initialize Firebase Storage for media uploads.
 * Used for storing images and videos uploaded by creators.
 */
const storage: FirebaseStorage = getStorage(app);

// =============================================================================
// EXPORTS
// =============================================================================

export { app, auth, firestore, storage };
export default app;

