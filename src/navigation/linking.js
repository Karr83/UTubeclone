// Deep Linking Configuration
// Handles URL/deep link mapping to screens

export const linking = {
  prefixes: ['msgift://', 'https://msgift.com'],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      
      // User screens
      Home: 'home',
      Explore: 'explore',
      Creator: 'creator/:id',
      Content: 'content/:id',
      Profile: 'profile',
      Subscriptions: 'subscriptions',
      
      // Creator screens
      CreatorDashboard: 'creator/dashboard',
      CreatorContent: 'creator/content',
      CreatorAnalytics: 'creator/analytics',
      
      // Admin screens
      AdminDashboard: 'admin/dashboard',
      AdminUsers: 'admin/users',
      AdminCreators: 'admin/creators',
      
      // Future: Streaming
      // LiveStream: 'live/:id',
    },
  },
};

