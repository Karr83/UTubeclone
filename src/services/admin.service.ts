/**
 * Admin Service
 * 
 * This service handles all admin-related operations including:
 * - Content moderation (approve, reject, remove)
 * - User management (suspend, unsuspend, ban)
 * - Dashboard statistics
 * - Moderation audit logging
 * 
 * SECURITY:
 * - All functions should be called only by admin users
 * - Role verification should happen at the UI/context level
 * - Firestore Security Rules provide server-side enforcement
 * 
 * ARCHITECTURE:
 * - Content moderation updates /content/{id} documents
 * - User moderation updates /users/{id} documents
 * - Audit logs stored in /moderationLogs collection
 */

/* PHASE 2: Firebase imports commented out
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  QueryConstraint,
} from 'firebase/firestore';
*/

// PHASE 3B: Import real Firebase functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  QueryConstraint,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

import { UserProfile, UserRole } from '../types/auth';
import { Content, ContentStatus } from '../types/content';
import {
  UserStatus,
  ModerationStatus,
  AdminUserView,
  AdminContentView,
  AdminUserQueryOptions,
  AdminContentQueryOptions,
  AdminUserListResponse,
  AdminContentListResponse,
  ModerateContentData,
  ModerateUserData,
  ModerationLogEntry,
  AdminDashboardStats,
  RejectionReason,
  SuspensionReason,
} from '../types/admin';

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

const USERS_COLLECTION = 'users';
const CONTENT_COLLECTION = 'content';
const MODERATION_LOGS_COLLECTION = 'moderationLogs';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert Firestore user document to AdminUserView.
 */
function docToAdminUser(docId: string, data: any): AdminUserView {
  return {
    uid: docId,
    email: data.email || '',
    role: data.role || 'user',
    createdAt: data.createdAt?.toDate() || new Date(),
    displayName: data.displayName,
    photoURL: data.photoURL,
    lastLoginAt: data.lastLoginAt?.toDate(),
    // Moderation fields with defaults
    status: data.status || 'active',
    suspendedAt: data.suspendedAt?.toDate(),
    suspendedBy: data.suspendedBy,
    suspensionReason: data.suspensionReason,
    suspensionNotes: data.suspensionNotes,
    suspensionExpiresAt: data.suspensionExpiresAt?.toDate() || null,
    warningCount: data.warningCount || 0,
    removedContentCount: data.removedContentCount || 0,
  };
}

/**
 * Convert Firestore content document to AdminContentView.
 */
function docToAdminContent(docId: string, data: any): AdminContentView {
  return {
    id: docId,
    creatorId: data.creatorId,
    title: data.title || '',
    description: data.description,
    mediaType: data.mediaType || 'image',
    mediaUrl: data.mediaUrl || '',
    thumbnailUrl: data.thumbnailUrl,
    visibility: data.visibility || 'public',
    status: data.status || 'pending',
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate(),
    publishedAt: data.publishedAt?.toDate(),
    viewCount: data.viewCount || 0,
    likeCount: data.likeCount || 0,
    commentCount: data.commentCount || 0,
    // Moderation fields
    moderationStatus: data.moderationStatus || data.status || 'pending',
    reviewedAt: data.reviewedAt?.toDate(),
    reviewedBy: data.reviewedBy,
    rejectionReason: data.rejectionReason,
    moderationNotes: data.moderationNotes,
    reportCount: data.reportCount || 0,
    creator: data.creator,
    // Boost fields
    isBoosted: data.isBoosted || false,
    boostLevel: data.boostLevel || 0,
  };
}

/**
 * Log a moderation action for audit trail.
 */
async function logModerationAction(
  type: 'content' | 'user',
  targetId: string,
  action: string,
  adminId: string,
  adminEmail: string,
  reason?: string,
  notes?: string,
  previousState?: Record<string, any>,
  newState?: Record<string, any>
): Promise<void> {
  try {
    const logEntry = {
      type,
      targetId,
      action,
      adminId,
      adminEmail,
      timestamp: serverTimestamp(),
      reason,
      notes,
      previousState,
      newState,
    };
    
    await addDoc(collection(firestore, MODERATION_LOGS_COLLECTION), logEntry);
  } catch (error) {
    console.error('Failed to log moderation action:', error);
    // Don't throw - logging failure shouldn't block the action
  }
}

// =============================================================================
// ADMIN SERVICE
// =============================================================================

export const adminService = {
  // ===========================================================================
  // CONTENT MODERATION
  // ===========================================================================

  /**
   * Get all content for moderation queue.
   * 
   * @param options - Query options for filtering and pagination
   * @returns Paginated list of content with moderation info
   */
  getAllContent: async (
    options: AdminContentQueryOptions = {}
  ): Promise<AdminContentListResponse> => {
    try {
      const constraints: QueryConstraint[] = [
        orderBy(options.orderBy || 'createdAt', options.orderDirection || 'desc'),
        limit(options.limit || 20),
      ];
      
      // Filter by moderation status
      if (options.moderationStatus) {
        constraints.unshift(where('status', '==', options.moderationStatus));
      }
      
      // Filter by creator
      if (options.creatorId) {
        constraints.unshift(where('creatorId', '==', options.creatorId));
      }
      
      // Filter by report count
      if (options.minReportCount && options.minReportCount > 0) {
        constraints.unshift(where('reportCount', '>=', options.minReportCount));
      }
      
      // Pagination cursor
      if (options.startAfter) {
        const lastDoc = await getDoc(doc(firestore, CONTENT_COLLECTION, options.startAfter));
        if (lastDoc.exists()) {
          constraints.push(startAfter(lastDoc));
        }
      }
      
      const q = query(collection(firestore, CONTENT_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const items: AdminContentView[] = snapshot.docs.map((doc: any) =>
        docToAdminContent(doc.id, doc.data())
      );
      
      return {
        items,
        hasMore: items.length === (options.limit || 20),
        lastId: items.length > 0 ? items[items.length - 1].id : undefined,
      };
    } catch (error) {
      console.error('Error fetching content for moderation:', error);
      return { items: [], hasMore: false };
    }
  },

  /**
   * Get content pending moderation.
   * Convenience function that filters for pending status.
   * 
   * @param limit - Maximum number of items to return
   * @returns List of pending content
   */
  getPendingContent: async (
    pageLimit: number = 20
  ): Promise<AdminContentListResponse> => {
    return adminService.getAllContent({
      moderationStatus: 'pending',
      limit: pageLimit,
      orderBy: 'createdAt',
      orderDirection: 'asc', // Oldest first (FIFO)
    });
  },

  /**
   * Moderate content (approve, reject, or remove).
   * 
   * @param data - Moderation action data
   * @param adminId - Admin's user ID
   * @param adminEmail - Admin's email for logging
   */
  moderateContent: async (
    data: ModerateContentData,
    adminId: string,
    adminEmail: string
  ): Promise<void> => {
    const { contentId, action, rejectionReason, notes } = data;
    
    try {
      const docRef = doc(firestore, CONTENT_COLLECTION, contentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Content not found');
      }
      
      const previousData = docSnap.data();
      const previousStatus = previousData.status;
      
      // Determine new status based on action
      let newStatus: ContentStatus;
      switch (action) {
        case 'approve':
          newStatus = 'published';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'remove':
          newStatus = 'removed';
          break;
        case 'restore':
          newStatus = 'published';
          break;
        default:
          throw new Error(`Invalid action: ${action}`);
      }
      
      // Build update data
      const updateData: Record<string, any> = {
        status: newStatus,
        moderationStatus: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        updatedAt: serverTimestamp(),
      };
      
      // Add rejection reason if rejecting
      if (action === 'reject' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      // Add moderation notes
      if (notes) {
        updateData.moderationNotes = notes;
      }
      
      // Add published timestamp for approvals
      if (action === 'approve' || action === 'restore') {
        updateData.publishedAt = serverTimestamp();
      }
      
      // Update the document
      await updateDoc(docRef, updateData);
      
      // Log the action
      await logModerationAction(
        'content',
        contentId,
        action,
        adminId,
        adminEmail,
        rejectionReason,
        notes,
        { status: previousStatus },
        { status: newStatus }
      );
      
      // If content was removed, update creator's removed content count
      if (action === 'remove') {
        const creatorRef = doc(firestore, USERS_COLLECTION, previousData.creatorId);
        const creatorSnap = await getDoc(creatorRef);
        if (creatorSnap.exists()) {
          const currentCount = creatorSnap.data().removedContentCount || 0;
          await updateDoc(creatorRef, {
            removedContentCount: currentCount + 1,
          });
        }
      }
    } catch (error: any) {
      console.error('Error moderating content:', error);
      throw new Error(`Failed to ${action} content: ${error.message}`);
    }
  },

  /**
   * Approve content (shorthand for moderateContent with approve action).
   */
  approveContent: async (
    contentId: string,
    adminId: string,
    adminEmail: string,
    notes?: string
  ): Promise<void> => {
    return adminService.moderateContent(
      { contentId, action: 'approve', notes },
      adminId,
      adminEmail
    );
  },

  /**
   * Reject content (shorthand for moderateContent with reject action).
   */
  rejectContent: async (
    contentId: string,
    adminId: string,
    adminEmail: string,
    reason: RejectionReason,
    notes?: string
  ): Promise<void> => {
    return adminService.moderateContent(
      { contentId, action: 'reject', rejectionReason: reason, notes },
      adminId,
      adminEmail
    );
  },

  /**
   * Remove content (shorthand for moderateContent with remove action).
   */
  removeContent: async (
    contentId: string,
    adminId: string,
    adminEmail: string,
    reason: RejectionReason,
    notes?: string
  ): Promise<void> => {
    return adminService.moderateContent(
      { contentId, action: 'remove', rejectionReason: reason, notes },
      adminId,
      adminEmail
    );
  },

  /**
   * Update content status directly.
   */
  updateContentStatus: async (
    contentId: string,
    newStatus: ContentStatus,
    adminId: string,
    adminEmail: string
  ): Promise<void> => {
    const action = newStatus === 'published' ? 'approve' : 
                   newStatus === 'rejected' ? 'reject' : 
                   newStatus === 'removed' ? 'remove' : 'approve';
    
    return adminService.moderateContent(
      { contentId, action: action as any },
      adminId,
      adminEmail
    );
  },

  // ===========================================================================
  // USER MANAGEMENT
  // ===========================================================================

  /**
   * Get all users with moderation info.
   * 
   * @param options - Query options for filtering and pagination
   * @returns Paginated list of users with moderation info
   */
  getAllUsers: async (
    options: AdminUserQueryOptions = {}
  ): Promise<AdminUserListResponse> => {
    try {
      const constraints: QueryConstraint[] = [
        orderBy(options.orderBy || 'createdAt', options.orderDirection || 'desc'),
        limit(options.limit || 20),
      ];
      
      // Filter by role
      if (options.role) {
        constraints.unshift(where('role', '==', options.role));
      }
      
      // Filter by status
      if (options.status) {
        constraints.unshift(where('status', '==', options.status));
      }
      
      // Pagination cursor
      if (options.startAfter) {
        const lastDoc = await getDoc(doc(firestore, USERS_COLLECTION, options.startAfter));
        if (lastDoc.exists()) {
          constraints.push(startAfter(lastDoc));
        }
      }
      
      const q = query(collection(firestore, USERS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const items: AdminUserView[] = snapshot.docs.map((doc: any) =>
        docToAdminUser(doc.id, doc.data())
      );
      
      return {
        items,
        hasMore: items.length === (options.limit || 20),
        lastId: items.length > 0 ? items[items.length - 1].uid : undefined,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { items: [], hasMore: false };
    }
  },

  /**
   * Get a single user by ID.
   * 
   * @param userId - User ID to fetch
   * @returns User profile with moderation info or null
   */
  getUserById: async (userId: string): Promise<AdminUserView | null> => {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docToAdminUser(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  /**
   * Moderate a user (suspend, unsuspend, ban, warn).
   * 
   * @param data - User moderation action data
   * @param adminId - Admin's user ID
   * @param adminEmail - Admin's email for logging
   */
  moderateUser: async (
    data: ModerateUserData,
    adminId: string,
    adminEmail: string
  ): Promise<void> => {
    const { userId, action, reason, notes, durationDays } = data;
    
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('User not found');
      }
      
      const previousData = docSnap.data();
      const previousStatus = previousData.status || 'active';
      
      // Determine new status and build update data
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      
      let newStatus: UserStatus;
      
      switch (action) {
        case 'suspend':
          newStatus = 'suspended';
          updateData.status = newStatus;
          updateData.suspendedAt = serverTimestamp();
          updateData.suspendedBy = adminId;
          updateData.suspensionReason = reason;
          updateData.suspensionNotes = notes;
          if (durationDays && durationDays > 0) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);
            updateData.suspensionExpiresAt = Timestamp.fromDate(expiresAt);
          } else {
            updateData.suspensionExpiresAt = null; // Indefinite
          }
          break;
          
        case 'unsuspend':
          newStatus = 'active';
          updateData.status = newStatus;
          updateData.suspendedAt = null;
          updateData.suspendedBy = null;
          updateData.suspensionReason = null;
          updateData.suspensionNotes = null;
          updateData.suspensionExpiresAt = null;
          break;
          
        case 'ban':
          newStatus = 'banned';
          updateData.status = newStatus;
          updateData.suspendedAt = serverTimestamp();
          updateData.suspendedBy = adminId;
          updateData.suspensionReason = reason;
          updateData.suspensionNotes = notes;
          updateData.suspensionExpiresAt = null; // Permanent
          break;
          
        case 'warn':
          newStatus = previousStatus as UserStatus;
          const currentWarnings = previousData.warningCount || 0;
          updateData.warningCount = currentWarnings + 1;
          break;
          
        default:
          throw new Error(`Invalid action: ${action}`);
      }
      
      // Update the document
      await updateDoc(docRef, updateData);
      
      // Log the action
      await logModerationAction(
        'user',
        userId,
        action,
        adminId,
        adminEmail,
        reason,
        notes,
        { status: previousStatus },
        { status: newStatus }
      );
    } catch (error: any) {
      console.error('Error moderating user:', error);
      throw new Error(`Failed to ${action} user: ${error.message}`);
    }
  },

  /**
   * Suspend a user (shorthand).
   */
  suspendUser: async (
    userId: string,
    adminId: string,
    adminEmail: string,
    reason: SuspensionReason,
    notes?: string,
    durationDays?: number
  ): Promise<void> => {
    return adminService.moderateUser(
      { userId, action: 'suspend', reason, notes, durationDays },
      adminId,
      adminEmail
    );
  },

  /**
   * Unsuspend a user (shorthand).
   */
  unsuspendUser: async (
    userId: string,
    adminId: string,
    adminEmail: string
  ): Promise<void> => {
    return adminService.moderateUser(
      { userId, action: 'unsuspend' },
      adminId,
      adminEmail
    );
  },

  /**
   * Update user status directly.
   */
  updateUserStatus: async (
    userId: string,
    newStatus: UserStatus,
    adminId: string,
    adminEmail: string,
    reason?: SuspensionReason
  ): Promise<void> => {
    const action = newStatus === 'active' ? 'unsuspend' : 
                   newStatus === 'suspended' ? 'suspend' : 'ban';
    
    return adminService.moderateUser(
      { userId, action, reason },
      adminId,
      adminEmail
    );
  },

  // ===========================================================================
  // DASHBOARD & STATISTICS
  // ===========================================================================

  /**
   * Get admin dashboard statistics.
   * 
   * @returns Dashboard stats for users and content
   */
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      // Get user counts
      const usersRef = collection(firestore, USERS_COLLECTION);
      const contentRef = collection(firestore, CONTENT_COLLECTION);
      
      // Total users
      const totalUsersSnapshot = await getCountFromServer(usersRef);
      const totalUsers = totalUsersSnapshot.data().count;
      
      // Users by role
      const regularUsersSnapshot = await getCountFromServer(
        query(usersRef, where('role', '==', 'user'))
      );
      const creatorsSnapshot = await getCountFromServer(
        query(usersRef, where('role', '==', 'creator'))
      );
      const adminsSnapshot = await getCountFromServer(
        query(usersRef, where('role', '==', 'admin'))
      );
      
      // Suspended users
      const suspendedSnapshot = await getCountFromServer(
        query(usersRef, where('status', '==', 'suspended'))
      );
      
      // Total content
      const totalContentSnapshot = await getCountFromServer(contentRef);
      const totalContent = totalContentSnapshot.data().count;
      
      // Content by status
      const pendingSnapshot = await getCountFromServer(
        query(contentRef, where('status', '==', 'pending'))
      );
      const publishedSnapshot = await getCountFromServer(
        query(contentRef, where('status', '==', 'published'))
      );
      const rejectedSnapshot = await getCountFromServer(
        query(contentRef, where('status', '==', 'rejected'))
      );
      const removedSnapshot = await getCountFromServer(
        query(contentRef, where('status', '==', 'removed'))
      );
      
      // Recent moderation actions (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentActionsSnapshot = await getCountFromServer(
        query(
          collection(firestore, MODERATION_LOGS_COLLECTION),
          where('timestamp', '>=', Timestamp.fromDate(yesterday))
        )
      );
      
      return {
        totalUsers,
        usersByRole: {
          user: regularUsersSnapshot.data().count,
          creator: creatorsSnapshot.data().count,
          admin: adminsSnapshot.data().count,
        },
        activeUsers: totalUsers, // Would need last login tracking
        suspendedUsers: suspendedSnapshot.data().count,
        totalContent: totalContent,
        pendingContent: pendingSnapshot.data().count,
        contentByStatus: {
          pending: pendingSnapshot.data().count,
          published: publishedSnapshot.data().count,
          rejected: rejectedSnapshot.data().count,
          removed: removedSnapshot.data().count,
        },
        recentActions: recentActionsSnapshot.data().count,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return empty stats on error
      return {
        totalUsers: 0,
        usersByRole: { user: 0, creator: 0, admin: 0 },
        activeUsers: 0,
        suspendedUsers: 0,
        totalContent: 0,
        pendingContent: 0,
        contentByStatus: { pending: 0, published: 0, rejected: 0, removed: 0 },
        recentActions: 0,
      };
    }
  },

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  /**
   * Check if a user can upload content.
   * Users who are suspended cannot upload.
   * 
   * @param userId - User ID to check
   * @returns Whether user can upload
   */
  canUserUpload: async (userId: string): Promise<boolean> => {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return false;
      }
      
      const userData = docSnap.data();
      const status = userData.status || 'active';
      const role = userData.role;
      
      // Must be creator and not suspended
      return role === 'creator' && status === 'active';
    } catch (error) {
      console.error('Error checking upload permission:', error);
      return false;
    }
  },
};

export default adminService;

