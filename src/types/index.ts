/**
 * Types Index
 * 
 * Central export point for all TypeScript type definitions.
 * Import types from here: import { UserProfile, MembershipTier, Content, AdminUserView } from '@/types';
 */

export * from './auth';
export * from './membership';
export * from './content';
export * from './admin';
export * from './payment';
export * from './streaming';
export * from './chat';
export * from './recording';

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
