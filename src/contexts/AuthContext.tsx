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
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
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
// DEMO MODE - Set to true to bypass Firebase auth and see the UI
// =============================================================================
const DEMO_MODE = true;

// Mock user for demo mode - change role to 'creator' or 'admin' to test different views
const DEMO_USER: UserProfile = {
  uid: 'demo-user-123',
  email: 'demo@example.com',
  role: 'user' as UserRole, // Change to 'creator' or 'admin' to test other roles
  status: 'active',
  createdAt: new Date(),
  displayName: 'Demo User',
};

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
    // DEMO MODE: Skip Firebase auth and use mock user
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE ACTIVE - Using mock user');
      setProfile(DEMO_USER);
      setUser({ uid: DEMO_USER.uid, email: DEMO_USER.email } as FirebaseUser);
      setLoading(false);
      return;
    }

    /**
     * Subscribe to Firebase Auth state changes.
     * This fires:
     * - Immediately with current auth state
     * - Whenever user signs in or out
     * - When the app is opened (checks persisted auth)
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
      if (DEMO_MODE) {
        console.log('🎭 DEMO MODE: Sign up simulated');
        return;
      }
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
      if (DEMO_MODE) {
        console.log('🎭 DEMO MODE: Sign in simulated');
        return;
      }
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
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE: Sign out simulated (staying logged in for demo)');
      return;
    }
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

