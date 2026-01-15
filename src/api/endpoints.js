// API Endpoints - All backend endpoint definitions
// Organized by feature/domain

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
    PREFERENCES: '/users/preferences',
  },

  // Creators
  CREATORS: {
    LIST: '/creators',
    PROFILE: '/creators/:id',
    CONTENT: '/creators/:id/content',
    SUBSCRIBE: '/creators/:id/subscribe',
  },

  // Content
  CONTENT: {
    FEED: '/content/feed',
    DETAILS: '/content/:id',
    LIKE: '/content/:id/like',
    COMMENT: '/content/:id/comments',
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    PLANS: '/subscriptions/plans',
    CURRENT: '/subscriptions/current',
    HISTORY: '/subscriptions/history',
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    CREATORS: '/admin/creators',
    REPORTS: '/admin/reports',
  },

  // Future: Streaming (placeholder)
  STREAMING: {
    // TODO: Add streaming endpoints when implementing
  },
};

