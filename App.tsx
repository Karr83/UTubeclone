/**
 * App Entry Point
 * 
 * This is the root component of the application.
 * It sets up the global providers and renders the navigation tree.
 * 
 * PROVIDER HIERARCHY:
 * 1. ErrorBoundary - Catches JavaScript errors in component tree
 * 2. SafeAreaProvider - Handles safe area insets
 * 3. AuthProvider - Provides authentication state
 * 4. MembershipProvider - Provides membership tier and feature access
 * 5. RootNavigator - Handles navigation based on auth state
 * 
 * IMPORTANT: Provider order matters!
 * - ErrorBoundary should be outermost to catch all errors
 * - MembershipProvider must be inside AuthProvider (it depends on auth state)
 * - RootNavigator must be inside both (it uses both contexts)
 * 
 * TODO Phase 3: Add ThemeProvider for runtime theme switching
 * TODO Phase 3: Add NotificationProvider for push notifications
 * TODO Phase 3: Add AnalyticsProvider for event tracking
 */

// #region agent log
console.log('[DEBUG-E] App.tsx module loading START');
// #endregion

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from './src/components/common';
import { AuthProvider } from './src/contexts/AuthContext';
import { MembershipProvider } from './src/contexts/MembershipContext';
import RootNavigator from './src/navigation/RootNavigator';

// #region agent log
console.log('[DEBUG-E] App.tsx imports complete');
// #endregion

/**
 * Root App component.
 * Sets up providers and renders the navigation tree.
 */
export default function App(): JSX.Element {
  // #region agent log
  console.log('[DEBUG-E] App component rendering');
  // #endregion
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* Status bar configuration - light content for dark theme */}
        <StatusBar style="light" />
        
        {/* Auth provider - handles user authentication */}
        <AuthProvider>
          {/* Membership provider - handles tier and feature access */}
          <MembershipProvider>
            {/* Root navigator - handles auth-based routing */}
            <RootNavigator />
          </MembershipProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
