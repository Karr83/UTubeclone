/**
 * Auth Navigator
 * 
 * Navigation stack for unauthenticated users.
 * Contains screens for login, registration, and password recovery.
 * 
 * SCREENS:
 * - Login: Sign in with email/password
 * - Register: Create new account with role selection
 * - ForgotPassword: Password recovery (placeholder)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../../screens/auth/LoginScreen';
import RegisterScreen from '../../screens/auth/RegisterScreen';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Type-safe navigation params for Auth stack.
 * Allows type checking when navigating between screens.
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// =============================================================================
// NAVIGATOR
// =============================================================================

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth Navigator component.
 * Renders the authentication flow screens.
 */
export default function AuthNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />
      {/* ForgotPassword screen can be added here */}
    </Stack.Navigator>
  );
}

