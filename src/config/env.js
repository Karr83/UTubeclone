// Environment Configuration - Environment-specific variables
// Uses Expo's environment variable system

export const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  API_VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  
  // Environment
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
  
  // External Services (placeholders)
  STRIPE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  
  // Future: Streaming service config
  // STREAMING_URL: process.env.EXPO_PUBLIC_STREAMING_URL || '',
};

