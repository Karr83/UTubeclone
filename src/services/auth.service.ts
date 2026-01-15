/**
 * Authentication Service
 * 
 * This service handles all authentication operations using Firebase Auth
 * and manages user profiles in Firestore. It provides a clean abstraction
 * layer between Firebase and the rest of the application.
 * 
 * RESPONSIBILITIES:
 * - Sign up new users (creates Auth account + Firestore profile)
 * - Sign in existing users
 * - Sign out users
 * - Fetch user profiles from Firestore
 * - Map Firebase errors to user-friendly messages
 * 
 * USAGE:
 * import { authService } from '@/services/auth.service';
 * await authService.signUp('email@example.com', 'password', 'user');
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { auth, firestore } from '../config/firebase';
import { 
  UserProfile, 
  UserRole, 
  CreateUserProfileData,
  AuthError,
  AuthErrorCode,
} from '../types/auth';
import { DEFAULT_MEMBERSHIP_TIER } from '../constants/membership';

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

/** Firestore collection name for user profiles */
const USERS_COLLECTION = 'users';

// =============================================================================
// AUTH SERVICE
// =============================================================================

/**
 * Authentication service object containing all auth-related operations.
 */
export const authService = {
  /**
   * Sign up a new user with email, password, and role.
   * 
   * This function:
   * 1. Creates a Firebase Auth account
   * 2. Creates a corresponding user profile in Firestore
   * 
   * @param email - User's email address
   * @param password - User's password (min 6 characters)
   * @param role - User's role ('user' | 'creator' | 'admin')
   * @returns The created UserCredential
   * @throws AuthError if signup fails
   * 
   * @example
   * try {
   *   await authService.signUp('user@example.com', 'securePassword123', 'user');
   * } catch (error) {
   *   console.error('Signup failed:', error.message);
   * }
   */
  signUp: async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<UserCredential> => {
    try {
      // Step 1: Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 2: Create user profile in Firestore
      const profileData: CreateUserProfileData = {
        uid: userCredential.user.uid,
        email: email.toLowerCase().trim(),
        role,
      };

      await createUserProfile(profileData);

      return userCredential;
    } catch (error: any) {
      throw mapFirebaseError(error);
    }
  },

  /**
   * Sign in an existing user with email and password.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns The UserCredential on successful sign in
   * @throws AuthError if sign in fails
   * 
   * @example
   * try {
   *   await authService.signIn('user@example.com', 'password123');
   *   // User is now signed in, auth state will update automatically
   * } catch (error) {
   *   console.error('Sign in failed:', error.message);
   * }
   */
  signIn: async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      // Update last login timestamp (fire and forget)
      updateLastLogin(userCredential.user.uid).catch(console.error);

      return userCredential;
    } catch (error: any) {
      throw mapFirebaseError(error);
    }
  },

  /**
   * Sign out the currently authenticated user.
   * 
   * @throws AuthError if sign out fails
   * 
   * @example
   * await authService.signOut();
   * // User is now signed out, auth state will update automatically
   */
  signOut: async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw mapFirebaseError(error);
    }
  },

  /**
   * Fetch a user's profile from Firestore.
   * 
   * @param uid - The user's Firebase Auth UID
   * @returns The user's profile or null if not found
   * 
   * @example
   * const profile = await authService.getUserProfile('user-uid-123');
   * if (profile) {
   *   console.log('User role:', profile.role);
   * }
   */
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      
      return {
        uid: userDoc.id,
        email: data.email,
        role: data.role,
        status: data.status || 'active', // Default to active for existing users
        createdAt: data.createdAt?.toDate() || new Date(),
        displayName: data.displayName,
        photoURL: data.photoURL,
        lastLoginAt: data.lastLoginAt?.toDate(),
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a new user profile document in Firestore.
 * 
 * This function sets up the complete user profile including:
 * - Basic info (uid, email, role, status)
 * - Timestamps (createdAt)
 * - Default membership tier (free)
 * 
 * @param data - The user profile data to store
 */
async function createUserProfile(data: CreateUserProfileData): Promise<void> {
  const userRef = doc(firestore, USERS_COLLECTION, data.uid);
  
  await setDoc(userRef, {
    // Basic profile
    uid: data.uid,
    email: data.email,
    role: data.role,
    status: 'active', // New users default to active status
    createdAt: serverTimestamp(),
    
    // Membership - all new users start at free tier
    membershipTier: DEFAULT_MEMBERSHIP_TIER,
    membershipUpdatedAt: serverTimestamp(),
    membershipExpiresAt: null, // Free tier doesn't expire
    membershipActive: true,
  });
}

/**
 * Update the user's last login timestamp.
 * 
 * @param uid - The user's Firebase Auth UID
 */
async function updateLastLogin(uid: string): Promise<void> {
  const userRef = doc(firestore, USERS_COLLECTION, uid);
  
  await setDoc(
    userRef,
    { lastLoginAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Map Firebase error codes to user-friendly error messages.
 * 
 * @param error - The Firebase error object
 * @returns A structured AuthError with code and message
 */
function mapFirebaseError(error: any): AuthError {
  const code = (error.code as AuthErrorCode) || 'unknown';
  
  const errorMessages: Record<AuthErrorCode, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'unknown': 'An unexpected error occurred. Please try again.',
  };

  return {
    code,
    message: errorMessages[code] || errorMessages['unknown'],
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default authService;

