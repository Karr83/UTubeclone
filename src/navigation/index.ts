/**
 * Navigation Index
 * 
 * Central export point for navigation components.
 */

export { default as RootNavigator } from './RootNavigator';
export { default as AuthNavigator } from './stacks/AuthNavigator';
export { default as UserNavigator } from './stacks/UserNavigator';
export { default as CreatorNavigator } from './stacks/CreatorNavigator';
export { default as AdminNavigator } from './stacks/AdminNavigator';

// Type exports - Tab navigators
export type { AuthStackParamList } from './stacks/AuthNavigator';
export type { UserTabParamList, HomeStackParamList, LiveStackParamList, LibraryStackParamList, ProfileStackParamList } from './stacks/UserNavigator';
export type { CreatorTabParamList, DashboardStackParamList, ContentStackParamList, StreamStackParamList, CreatorProfileStackParamList } from './stacks/CreatorNavigator';
export type { AdminTabParamList, AdminStackParamList } from './stacks/AdminNavigator';

