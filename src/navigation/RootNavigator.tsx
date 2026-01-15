/**
 * Root Navigator
 * 
 * This is the main navigation container that determines which navigation
 * stack to display based on the user's authentication status and role.
 * 
 * NAVIGATION FLOW:
 * 1. App starts → Shows loading screen
 * 2. Auth checked → If not authenticated → Auth Stack (Login/Register)
 * 3. Auth checked → If authenticated → Role-based App Stack
 *    - user role → UserNavigator (Home, Explore, Library, Profile)
 *    - creator role → CreatorNavigator (Dashboard, Content, Analytics)
 *    - admin role → AdminNavigator (Dashboard, Users, Creators, Reports)
 * 
 * PROTECTED ROUTES:
 * The auth state from AuthContext automatically protects routes.
 * When a user signs out, they're redirected to the Auth Stack.
 * When a user signs in, they're redirected to their role-appropriate stack.
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './stacks/AuthNavigator';
import UserNavigator from './stacks/UserNavigator';
import CreatorNavigator from './stacks/CreatorNavigator';
import AdminNavigator from './stacks/AdminNavigator';
import { UserRole } from '../types/auth';

// =============================================================================
// LOADING SCREEN
// =============================================================================

/**
 * Loading screen shown while determining auth state.
 * Displayed on app launch before Firebase Auth resolves.
 */
function LoadingScreen(): JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// =============================================================================
// ROOT NAVIGATOR
// =============================================================================

/**
 * Root Navigator component.
 * 
 * Renders the appropriate navigation stack based on:
 * - Authentication status (signed in or not)
 * - User role (user, creator, or admin)
 */
export default function RootNavigator(): JSX.Element {
  const { isAuthenticated, role, loading } = useAuth();

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  /**
   * Show loading screen while auth state is being determined.
   * This prevents flashing the wrong screen on app launch.
   */
  if (loading) {
    return <LoadingScreen />;
  }

  // ---------------------------------------------------------------------------
  // NAVIGATOR SELECTION
  // ---------------------------------------------------------------------------

  /**
   * Get the appropriate navigator based on user role.
   * Each role has its own set of screens and tabs.
   */
  const getNavigatorForRole = (userRole: UserRole | null): JSX.Element => {
    switch (userRole) {
      case 'admin':
        // Admin gets access to platform management screens
        return <AdminNavigator />;
      
      case 'creator':
        // Creators get access to content creation and analytics
        return <CreatorNavigator />;
      
      case 'user':
      default:
        // Regular users get the consumer experience
        return <UserNavigator />;
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        // User is signed in - show role-appropriate navigator
        getNavigatorForRole(role)
      ) : (
        // User is not signed in - show auth screens
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});

