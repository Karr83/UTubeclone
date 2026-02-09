/**
 * Authentication Types
 * 
 * This file defines all TypeScript interfaces and types related to
 * authentication, user profiles, and role-based access control.
 * 
 * PHASE 2: Firebase imports removed
 */

// #region agent log
console.log('[DEBUG-C] types/auth.ts module loading START');
// #endregion

// PHASE 2: Comment out Firebase import
// import { User as FirebaseUser } from 'firebase/auth';

// Mock type for Phase 2
type FirebaseUser = any;

// =============================================================================
// USER ROLES
// =============================================================================

/**
 * User roles in the application.
 * - user: Regular consumer who can subscribe to creators
 * - creator: Content creator who can publish content and earn money
 * - admin: Platform administrator with management capabilities
 */
export type UserRole = 'user' | 'creator' | 'admin';

// =============================================================================
// USER STATUS
// =============================================================================

/**
 * User account status for moderation.
 * - active: Normal active account
 * - suspended: Temporarily suspended (can be unsuspended)
 * - banned: Permanently banned (cannot be unsuspended)
 */
export type UserStatus = 'active' | 'suspended' | 'banned';

// =============================================================================
// USER PROFILE
// =============================================================================

/**
 * User profile stored in Firestore.
 * This extends the basic Firebase Auth user with app-specific data.
 */
export interface UserProfile {
  /** Firebase Auth UID - primary identifier */
  uid: string;
  
  /** User's email address */
  email: string;
  
  /** User's role determining access permissions */
  role: UserRole;
  
  /** Account status for moderation (defaults to 'active') */
  status: UserStatus;
  
  /** Account creation timestamp */
  createdAt: Date;
  
  /** Display name (optional) */
  displayName?: string;
  
  /** Profile photo URL (optional) */
  photoURL?: string;
  
  /** Last login timestamp (optional) */
  lastLoginAt?: Date;
}

/**
 * Data required to create a new user profile in Firestore.
 * Used during the sign-up process.
 */
export interface CreateUserProfileData {
  uid: string;
  email: string;
  role: UserRole;
}

// =============================================================================
// AUTH STATE
// =============================================================================

/**
 * Authentication state provided by AuthContext.
 * Components can consume this to check auth status and user info.
 */
export interface AuthState {
  /** Firebase Auth user object (null if not authenticated) */
  user: FirebaseUser | null;
  
  /** User profile from Firestore (null if not loaded or not authenticated) */
  profile: UserProfile | null;
  
  /** User's role for quick access (null if not authenticated) */
  role: UserRole | null;
  
  /** Whether auth state is being determined (initial load) */
  loading: boolean;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Authentication actions provided by AuthContext.
 * Components can use these to trigger auth operations.
 */
export interface AuthActions {
  /** Sign up a new user with email, password, and role */
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  
  /** Sign in an existing user */
  signIn: (email: string, password: string) => Promise<void>;
  
  /** Sign out the current user */
  signOut: () => Promise<void>;
}

/**
 * Complete AuthContext value combining state and actions.
 */
export interface AuthContextValue extends AuthState, AuthActions {}

// =============================================================================
// AUTH ERRORS
// =============================================================================

/**
 * Custom error codes for authentication operations.
 * Maps Firebase error codes to user-friendly messages.
 */
export type AuthErrorCode =
  | 'auth/email-already-in-use'
  | 'auth/invalid-email'
  | 'auth/operation-not-allowed'
  | 'auth/weak-password'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/too-many-requests'
  | 'auth/network-request-failed'
  | 'unknown';

/**
 * Structured auth error for UI display.
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

