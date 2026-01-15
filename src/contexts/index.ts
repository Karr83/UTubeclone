/**
 * Contexts Index
 * 
 * Central export point for all React Context providers.
 * 
 * USAGE:
 * import { AuthProvider, useAuth, MembershipProvider, useMembership } from '@/contexts';
 */

export { AuthProvider, useAuth, AuthContext } from './AuthContext';
export { MembershipProvider, useMembership, MembershipContext } from './MembershipContext';

// Future contexts (uncomment when implemented):
// export { ThemeProvider, useTheme } from './ThemeContext';
// export { NotificationProvider, useNotifications } from './NotificationContext';
