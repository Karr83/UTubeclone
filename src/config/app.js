// App Configuration - Core app settings
export const APP_CONFIG = {
  name: 'VibeTube',
  version: '1.0.0',
  
  // Feature flags
  features: {
    streaming: false, // Future: Enable when streaming is implemented
    darkMode: false,
    pushNotifications: true,
    analytics: true,
  },
  
  // Subscription tiers
  subscriptionTiers: ['free', 'basic', 'premium'],
  
  // Content types supported
  contentTypes: ['image', 'video', 'article'],
  // Future: Add 'live_stream' when implementing streaming
  
  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Cache durations (in milliseconds)
  cache: {
    userProfile: 5 * 60 * 1000, // 5 minutes
    feed: 2 * 60 * 1000, // 2 minutes
    creators: 10 * 60 * 1000, // 10 minutes
  },
};

