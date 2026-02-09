/**
 * Firebase Mocks for Phase 2 UI-Only Development
 * 
 * This file provides mock implementations of all Firebase functions
 * so the app can run without Firebase initialized.
 * 
 * USAGE: Import these instead of real Firebase functions in services
 * 
 * In Phase 3, replace imports from this file with real Firebase.
 */

// =============================================================================
// MOCK FIRESTORE INSTANCES
// =============================================================================

export const firestore = null as any;
export const db = null as any;
export const storage = null as any;
export const auth = null as any;

// =============================================================================
// MOCK FIRESTORE FUNCTIONS
// =============================================================================

export const collection = (...args: any[]) => ({} as any);

export const doc = (...args: any[]) => ({} as any);

export const getDoc = async (...args: any[]) => ({
  exists: () => false,
  data: () => null,
  id: 'mock-id',
} as any);

export const getDocs = async (...args: any[]) => ({
  docs: [],
  empty: true,
  size: 0,
} as any);

export const setDoc = async (...args: any[]) => ({} as any);

export const addDoc = async (...args: any[]) => ({
  id: 'mock-id-' + Math.random().toString(36).substr(2, 9),
} as any);

export const updateDoc = async (...args: any[]) => ({} as any);

export const deleteDoc = async (...args: any[]) => ({} as any);

export const query = (...args: any[]) => ({} as any);

export const where = (...args: any[]) => ({} as any);

export const orderBy = (...args: any[]) => ({} as any);

export const limit = (...args: any[]) => ({} as any);

export const startAfter = (...args: any[]) => ({} as any);

export const onSnapshot = (...args: any[]) => {
  // Return unsubscribe function
  return () => {};
};

export const serverTimestamp = () => new Date() as any;

export const increment = (n: number) => n as any;

export const getCountFromServer = async (...args: any[]) => ({
  data: () => ({ count: 0 }),
} as any);

// =============================================================================
// MOCK TIMESTAMP
// =============================================================================

export const Timestamp = {
  fromDate: (d: Date) => d,
  now: () => new Date(),
  fromMillis: (ms: number) => new Date(ms),
} as any;

// =============================================================================
// MOCK TYPES
// =============================================================================

export type QueryConstraint = any;
export type Unsubscribe = () => void;

// =============================================================================
// MOCK FIREBASE FUNCTIONS (Cloud Functions)
// =============================================================================

export const getFunctions = () => ({} as any);

export const httpsCallable = (...args: any[]) => {
  // Return a function that returns a promise with data
  return async (...callArgs: any[]) => ({
    data: {},
  } as any);
};

// =============================================================================
// MOCK STORAGE FUNCTIONS
// =============================================================================

export const ref = (...args: any[]) => ({} as any);

export const uploadBytesResumable = (...args: any[]) => ({
  on: (...args2: any[]) => {},
  cancel: () => {},
  pause: () => {},
  resume: () => {},
} as any);

export const getDownloadURL = async (...args: any[]) => {
  return 'https://via.placeholder.com/400x300' as any;
};

export const deleteObject = async (...args: any[]) => ({} as any);

export type UploadTask = any;

// =============================================================================
// CONSOLE LOG FOR DEBUGGING
// =============================================================================

console.log('🎭 Firebase Mocks Loaded - Phase 2 UI-Only Mode Active');
