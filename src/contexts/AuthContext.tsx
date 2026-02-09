/**
 * Authentication Context
 * 
 * This context provides authentication state and actions to the entire app.
 * It wraps Firebase Auth's onAuthStateChanged listener to automatically
 * track the user's authentication status and profile.
 * 
 * FEATURES:
 * - Listens to Firebase Auth state changes
 * - Fetches user profile from Firestore on auth
 * - Provides user, role, and loading state
 * - Exposes signUp, signIn, signOut actions
 * 
 * USAGE:
 * 1. Wrap your app with <AuthProvider>
 * 2. Use the useAuth() hook in components
 * 
 * @example
 * // In App.tsx
 * <AuthProvider>
 *   <RootNavigator />
 * </AuthProvider>
 * 
 * // In a component
 * const { user, role, signOut } = useAuth();
 * if (role === 'admin') { ... }
 * 
 * TODO Phase 3: Add social auth providers (Google, Apple)
 * TODO Phase 3: Add password reset flow
 * TODO Phase 3: Add email verification
 * TODO Phase 3: Add biometric authentication
 */

// #region agent log
console.log('[DEBUG-C] AuthContext.tsx module loading START');
// #endregion

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// PHASE 3B: Firebase imports enabled for real authentication
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/auth.service';
import {
  AuthContextValue,
  AuthState,
  UserProfile,
  UserRole,
} from '../types/auth';

// =============================================================================
// PHASE 2: UI-ONLY MODE - Mock user for testing UI without Firebase
// =============================================================================

// PHASE 3B: UI-ONLY MODE disabled - using real Firebase Auth
// Mock user removed - authentication now handled by Firebase

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * The Auth Context instance.
 * Initialized as undefined to detect missing provider.
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the app and provides auth state.
 * 
 * This component:
 * 1. Sets up a Firebase Auth state listener on mount
 * 2. Fetches user profile when auth state changes
 * 3. Provides auth state and actions to children via context
 * 
 * @param children - Child components that will have access to auth context
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  /** Firebase Auth user object */
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  /** User profile from Firestore */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  /** Loading state during initial auth check */
  const [loading, setLoading] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // AUTH STATE LISTENER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // PHASE 3B: Defensive check - if auth is not initialized, show loading state
    if (!auth) {
      console.warn('⚠️ Firebase Auth not initialized - check Firebase configuration');
      setLoading(false);
      return;
    }

    /**
     * Subscribe to Firebase Auth state changes.
     * This listener automatically updates when user signs in/out.
     */
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // User is signed in - fetch their profile from Firestore
        try {
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        // User is signed out - clear profile
        setProfile(null);
      }

      // Auth state has been determined
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // AUTH ACTIONS
  // ---------------------------------------------------------------------------

  /**
   * Sign up a new user.
   * Creates Firebase Auth account and Firestore profile.
   */
  const signUp = useCallback(
    async (email: string, password: string, role: UserRole): Promise<void> => {
      setLoading(true);
      try {
        await authService.signUp(email, password, role);
        // Auth state listener will automatically update user and profile
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Sign in an existing user.
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      try {
        await authService.signIn(email, password);
        // Auth state listener will automatically update user and profile
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Sign out the current user.
   */
  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signOut();
      // Auth state listener will automatically clear user and profile
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  /**
   * Memoized context value to prevent unnecessary re-renders.
   * Only updates when state or actions change.
   */
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      // State
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      isAuthenticated: !!user,

      // Actions
      signUp,
      signIn,
      signOut,
    }),
    [user, profile, loading, signUp, signIn, signOut]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * Custom hook to access authentication context.
 * 
 * @returns The auth context value with state and actions
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * function ProfileScreen() {
 *   const { user, role, isAuthenticated, signOut } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <Text>Not logged in</Text>;
 *   }
 *   
 *   return (
 *     <View>
 *       <Text>Email: {user?.email}</Text>
 *       <Text>Role: {role}</Text>
 *       <Button title="Sign Out" onPress={signOut} />
 *     </View>
 *   );
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure to wrap your app with <AuthProvider>.'
    );
  }

  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { AuthContext };
export default AuthProvider;

