/**
 * App Entry Point
 * 
 * This is the root component of the application.
 * It sets up the global providers and renders the navigation tree.
 * 
 * PROVIDER HIERARCHY:
 * 1. SafeAreaProvider - Handles safe area insets
 * 2. AuthProvider - Provides authentication state
 * 3. MembershipProvider - Provides membership tier and feature access
 * 4. RootNavigator - Handles navigation based on auth state
 * 
 * IMPORTANT: Provider order matters!
 * - MembershipProvider must be inside AuthProvider (it depends on auth state)
 * - RootNavigator must be inside both (it uses both contexts)
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/contexts/AuthContext';
import { MembershipProvider } from './src/contexts/MembershipContext';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Root App component.
 * Sets up providers and renders the navigation tree.
 */
export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      {/* Status bar configuration */}
      <StatusBar style="auto" />
      
      {/* Auth provider - handles user authentication */}
      <AuthProvider>
        {/* Membership provider - handles tier and feature access */}
        <MembershipProvider>
          {/* Root navigator - handles auth-based routing */}
          <RootNavigator />
        </MembershipProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
