/**
 * Admin Types
 * 
 * This file defines all TypeScript interfaces and types related to
 * admin moderation, user management, and platform administration.
 * 
 * MODERATION ARCHITECTURE:
 * - Content goes through pending → approved/rejected workflow
 * - Users can be suspended/unsuspended by admins
 * - All moderation actions are logged for audit trail
 * 
 * ACCESS CONTROL:
 * - Only users with role='admin' can access admin features
 * - Admin actions require role verification at service level
 */

import { UserRole, UserProfile, UserStatus } from './auth';
import { Content, ContentStatus } from './content';

// Re-export UserStatus for backward compatibility with existing admin imports
export { UserStatus } from './auth';

// =============================================================================
// CONTENT MODERATION STATUS
// =============================================================================

/**
 * Extended content status for moderation workflow.
 * 
 * MODERATION FLOW:
 * 1. Creator uploads content → status: 'pending'
 * 2. Admin reviews content
 *    → Approve: status changes to 'published'
 *    → Reject: status changes to 'rejected'
 * 3. Admin can later remove published content → 'removed'
 * 
 * Note: This extends the base ContentStatus type
 */
export type ModerationStatus = 
  | 'pending'     // Awaiting admin review
  | 'approved'    // Approved and published
  | 'rejected'    // Rejected by admin
  | 'published'   // Live and visible (same as approved)
  | 'removed';    // Removed after being published

/**
 * Reason for content rejection.
 * Used to provide feedback to creators.
 */
export type RejectionReason =
  | 'inappropriate_content'
  | 'copyright_violation'
  | 'spam'
  | 'misleading'
  | 'low_quality'
  | 'policy_violation'
  | 'other';

/**
 * Reason for user suspension/ban.
 */
export type SuspensionReason =
  | 'policy_violation'
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'fraudulent_activity'
  | 'multiple_violations'
  | 'other';

// =============================================================================
// EXTENDED USER PROFILE FOR ADMIN
// =============================================================================

/**
 * Extended user profile with moderation fields.
 * These fields are added to the base UserProfile.
 */
export interface UserModerationFields {
  /** Current account status */
  status: UserStatus;
  
  /** If suspended, when the suspension was applied */
  suspendedAt?: Date;
  
  /** Admin who applied the suspension */
  suspendedBy?: string;
  
  /** Reason for suspension */
  suspensionReason?: SuspensionReason;
  
  /** Additional notes about suspension */
  suspensionNotes?: string;
  
  /** If suspended, when the suspension expires (null = indefinite) */
  suspensionExpiresAt?: Date | null;
  
  /** Number of warnings received */
  warningCount: number;
  
  /** Number of content items removed by moderation */
  removedContentCount: number;
}

/**
 * Full user profile as seen by admins.
 * Combines base profile with moderation fields.
 */
export interface AdminUserView extends UserProfile, UserModerationFields {}

// =============================================================================
// CONTENT MODERATION
// =============================================================================

/**
 * Extended content with moderation fields.
 * These fields track the moderation history of content.
 */
export interface ContentModerationFields {
  /** Moderation status (may differ from display status) */
  moderationStatus: ModerationStatus;
  
  /** When content was reviewed (if reviewed) */
  reviewedAt?: Date;
  
  /** Admin who reviewed the content */
  reviewedBy?: string;
  
  /** If rejected, the reason */
  rejectionReason?: RejectionReason;
  
  /** Additional moderation notes */
  moderationNotes?: string;
  
  /** Number of user reports against this content */
  reportCount: number;
}

/**
 * Full content view for admin moderation queue.
 */
export interface AdminContentView extends Content, ContentModerationFields {
  /** Creator's profile info for context */
  creator?: {
    uid: string;
    email: string;
    displayName?: string;
    status: UserStatus;
  };
}

// =============================================================================
// MODERATION ACTIONS
// =============================================================================

/**
 * Action types for content moderation.
 */
export type ContentModerationAction = 
  | 'approve'
  | 'reject'
  | 'remove'
  | 'restore';

/**
 * Data for moderating content.
 */
export interface ModerateContentData {
  /** Content ID to moderate */
  contentId: string;
  
  /** Action to take */
  action: ContentModerationAction;
  
  /** Rejection reason (required if action is 'reject') */
  rejectionReason?: RejectionReason;
  
  /** Additional notes */
  notes?: string;
}

/**
 * Action types for user moderation.
 */
export type UserModerationAction = 
  | 'suspend'
  | 'unsuspend'
  | 'ban'
  | 'warn';

/**
 * Data for moderating a user.
 */
export interface ModerateUserData {
  /** User ID to moderate */
  userId: string;
  
  /** Action to take */
  action: UserModerationAction;
  
  /** Suspension reason (required for suspend/ban) */
  reason?: SuspensionReason;
  
  /** Additional notes */
  notes?: string;
  
  /** Suspension duration in days (null = indefinite) */
  durationDays?: number | null;
}

// =============================================================================
// MODERATION LOG
// =============================================================================

/**
 * Log entry for moderation actions.
 * Stored in Firestore for audit trail.
 */
export interface ModerationLogEntry {
  /** Unique log entry ID */
  id: string;
  
  /** Type of moderation action */
  type: 'content' | 'user';
  
  /** ID of the content or user being moderated */
  targetId: string;
  
  /** Action taken */
  action: ContentModerationAction | UserModerationAction;
  
  /** Admin who performed the action */
  adminId: string;
  
  /** Admin's email for display */
  adminEmail: string;
  
  /** When the action was taken */
  timestamp: Date;
  
  /** Reason for the action */
  reason?: string;
  
  /** Additional notes */
  notes?: string;
  
  /** Previous state (for reverting) */
  previousState?: Record<string, any>;
  
  /** New state after action */
  newState?: Record<string, any>;
}

// =============================================================================
// ADMIN DASHBOARD STATS
// =============================================================================

/**
 * Statistics for the admin dashboard.
 */
export interface AdminDashboardStats {
  /** Total users on the platform */
  totalUsers: number;
  
  /** Users by role */
  usersByRole: {
    user: number;
    creator: number;
    admin: number;
  };
  
  /** Active users (logged in within 30 days) */
  activeUsers: number;
  
  /** Suspended users count */
  suspendedUsers: number;
  
  /** Total content items */
  totalContent: number;
  
  /** Content pending moderation */
  pendingContent: number;
  
  /** Content by status */
  contentByStatus: {
    pending: number;
    published: number;
    rejected: number;
    removed: number;
  };
  
  /** Recent moderation actions (last 24h) */
  recentActions: number;
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

/**
 * Options for querying users (admin only).
 */
export interface AdminUserQueryOptions {
  /** Filter by role */
  role?: UserRole;
  
  /** Filter by status */
  status?: UserStatus;
  
  /** Search by email or display name */
  search?: string;
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination cursor */
  startAfter?: string;
  
  /** Sort field */
  orderBy?: 'createdAt' | 'lastLoginAt' | 'email';
  
  /** Sort direction */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Options for querying content (admin moderation queue).
 */
export interface AdminContentQueryOptions {
  /** Filter by moderation status */
  moderationStatus?: ModerationStatus;
  
  /** Filter by creator ID */
  creatorId?: string;
  
  /** Filter by report count threshold */
  minReportCount?: number;
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination cursor */
  startAfter?: string;
  
  /** Sort field */
  orderBy?: 'createdAt' | 'reportCount' | 'reviewedAt';
  
  /** Sort direction */
  orderDirection?: 'asc' | 'desc';
}

// =============================================================================
// PAGINATED RESPONSES
// =============================================================================

/**
 * Paginated user list response.
 */
export interface AdminUserListResponse {
  items: AdminUserView[];
  hasMore: boolean;
  lastId?: string;
  totalCount?: number;
}

/**
 * Paginated content list response for moderation.
 */
export interface AdminContentListResponse {
  items: AdminContentView[];
  hasMore: boolean;
  lastId?: string;
  totalCount?: number;
}

