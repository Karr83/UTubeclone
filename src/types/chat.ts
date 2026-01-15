/**
 * Chat Types
 * 
 * This file defines all TypeScript interfaces and types for the
 * live stream chat feature with moderation support.
 * 
 * CHAT ARCHITECTURE:
 * ==================
 * 
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                         CHAT DATA FLOW                                   │
 *   ├─────────────────────────────────────────────────────────────────────────┤
 *   │                                                                          │
 *   │   User sends message                                                     │
 *   │         │                                                                │
 *   │         ▼                                                                │
 *   │   ┌─────────────────┐                                                   │
 *   │   │  Permission     │  Check: authenticated, not suspended, not muted   │
 *   │   │  Check          │                                                   │
 *   │   └────────┬────────┘                                                   │
 *   │            │                                                             │
 *   │            ▼                                                             │
 *   │   ┌─────────────────┐                                                   │
 *   │   │  Firestore      │  /streams/{streamId}/messages/{messageId}         │
 *   │   │  Write          │                                                   │
 *   │   └────────┬────────┘                                                   │
 *   │            │                                                             │
 *   │            ▼                                                             │
 *   │   ┌─────────────────┐                                                   │
 *   │   │  Real-time      │  All viewers receive update via onSnapshot        │
 *   │   │  Broadcast      │                                                   │
 *   │   └─────────────────┘                                                   │
 *   │                                                                          │
 *   └─────────────────────────────────────────────────────────────────────────┘
 * 
 * MODERATION HIERARCHY:
 * =====================
 * - Admin: Can delete any message, ban users globally
 * - Creator: Can delete messages in their stream, mute users in their stream
 * - User: Can only send messages (if not muted/suspended)
 * 
 * DATA STORAGE:
 * =============
 * - Messages: /streams/{streamId}/messages/{messageId}
 * - Mutes: /streams/{streamId}/mutes/{oderId}
 * - Global bans: /bannedUsers/{userId}
 */

// =============================================================================
// MESSAGE TYPES
// =============================================================================

/**
 * Chat message stored in Firestore.
 * 
 * Collection: /streams/{streamId}/messages/{messageId}
 */
export interface ChatMessage {
  /** Unique message ID (Firestore document ID) */
  id: string;
  
  /** Stream this message belongs to */
  streamId: string;
  
  /** User who sent the message */
  userId: string;
  
  /** Display name of the user */
  username: string;
  
  /** User's avatar URL (optional) */
  avatarUrl?: string;
  
  /** User's role for badge display */
  userRole: 'user' | 'creator' | 'admin';
  
  /** The message text */
  message: string;
  
  /** When message was sent */
  createdAt: Date;
  
  /** Whether message has been deleted by moderator */
  isDeleted: boolean;
  
  /** Who deleted the message (if deleted) */
  deletedBy?: string;
  
  /** When message was deleted (if deleted) */
  deletedAt?: Date;
  
  /** Reason for deletion (optional) */
  deletionReason?: string;
}

/**
 * Data for creating a new message.
 */
export interface SendMessageData {
  /** Stream ID */
  streamId: string;
  
  /** Message text */
  message: string;
}

/**
 * Message with metadata for display.
 */
export interface ChatMessageDisplay extends ChatMessage {
  /** Whether current user can delete this message */
  canDelete: boolean;
  
  /** Whether this is the current user's message */
  isOwnMessage: boolean;
  
  /** Whether user is muted in this stream */
  isMutedUser: boolean;
}

// =============================================================================
// MODERATION TYPES
// =============================================================================

/**
 * Mute record for stream-specific mutes.
 * 
 * Collection: /streams/{streamId}/mutes/{oderId}
 */
export interface StreamMute {
  /** Mute record ID */
  id: string;
  
  /** Stream ID */
  streamId: string;
  
  /** User who is muted */
  oderId: string;
  
  /** Username of muted user */
  username: string;
  
  /** Who muted the user (creator) */
  mutedBy: string;
  
  /** When the mute was applied */
  mutedAt: Date;
  
  /** When the mute expires (null = permanent for stream) */
  expiresAt?: Date | null;
  
  /** Reason for mute */
  reason?: string;
}

/**
 * Global chat ban record.
 * 
 * Collection: /chatBans/{userId}
 */
export interface ChatBan {
  /** Banned user ID */
  userId: string;
  
  /** Username */
  username: string;
  
  /** Who banned the user */
  bannedBy: string;
  
  /** When the ban was applied */
  bannedAt: Date;
  
  /** When the ban expires (null = permanent) */
  expiresAt?: Date | null;
  
  /** Reason for ban */
  reason: string;
  
  /** Whether ban is active */
  isActive: boolean;
}

/**
 * Moderation action types.
 */
export type ModerationAction = 
  | 'delete_message'
  | 'mute_user'
  | 'unmute_user'
  | 'ban_user'
  | 'unban_user';

/**
 * Moderation log entry.
 * 
 * Collection: /moderationLogs/{logId}
 */
export interface ModerationLogEntry {
  /** Log entry ID */
  id: string;
  
  /** Action performed */
  action: ModerationAction;
  
  /** Stream ID (if applicable) */
  streamId?: string;
  
  /** Target user ID */
  targetUserId: string;
  
  /** Target username */
  targetUsername: string;
  
  /** Moderator user ID */
  moderatorId: string;
  
  /** Moderator role */
  moderatorRole: 'creator' | 'admin';
  
  /** Message ID (if action is delete_message) */
  messageId?: string;
  
  /** Reason for action */
  reason?: string;
  
  /** When action was performed */
  timestamp: Date;
}

// =============================================================================
// PERMISSION TYPES
// =============================================================================

/**
 * Chat permissions for current user.
 */
export interface ChatPermissions {
  /** Can user send messages */
  canSend: boolean;
  
  /** Can user delete their own messages */
  canDeleteOwn: boolean;
  
  /** Can user delete any message (moderator) */
  canDeleteAny: boolean;
  
  /** Can user mute others in this stream */
  canMute: boolean;
  
  /** Can user ban others globally */
  canBan: boolean;
  
  /** Reason if user cannot send */
  restrictionReason?: 'not_authenticated' | 'suspended' | 'muted' | 'banned' | 'stream_offline';
}

/**
 * Chat user info for display.
 */
export interface ChatUser {
  /** User ID */
  userId: string;
  
  /** Display username */
  username: string;
  
  /** Avatar URL */
  avatarUrl?: string;
  
  /** User role */
  role: 'user' | 'creator' | 'admin';
  
  /** Whether user is muted in current stream */
  isMuted: boolean;
  
  /** Whether user is globally banned */
  isBanned: boolean;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Chat context value.
 */
export interface ChatContextValue {
  /** Current messages */
  messages: ChatMessageDisplay[];
  
  /** Whether messages are loading */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Current user's permissions */
  permissions: ChatPermissions;
  
  /** Whether chat is enabled (stream is live) */
  isChatEnabled: boolean;
  
  /** Send a message */
  sendMessage: (text: string) => Promise<boolean>;
  
  /** Delete a message */
  deleteMessage: (messageId: string, reason?: string) => Promise<boolean>;
  
  /** Mute a user in this stream */
  muteUser: (userId: string, reason?: string, durationMinutes?: number) => Promise<boolean>;
  
  /** Unmute a user */
  unmuteUser: (oderId: string) => Promise<boolean>;
  
  /** Ban a user globally (admin only) */
  banUser: (userId: string, reason: string) => Promise<boolean>;
  
  /** Get muted users list */
  getMutedUsers: () => Promise<StreamMute[]>;
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

/**
 * Options for querying chat messages.
 */
export interface ChatQueryOptions {
  /** Maximum messages to fetch */
  limit?: number;
  
  /** Include deleted messages */
  includeDeleted?: boolean;
  
  /** Start after message ID (for pagination) */
  startAfter?: string;
}

/**
 * Chat state for hook.
 */
export interface ChatState {
  /** Messages in order */
  messages: ChatMessage[];
  
  /** Whether loading */
  isLoading: boolean;
  
  /** Whether sending a message */
  isSending: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Whether chat is connected */
  isConnected: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Chat configuration constants.
 */
export const CHAT_CONFIG = {
  /** Maximum message length */
  MAX_MESSAGE_LENGTH: 300,
  
  /** Maximum messages to display */
  MAX_MESSAGES_DISPLAY: 100,
  
  /** Message cooldown in milliseconds */
  MESSAGE_COOLDOWN_MS: 1000,
  
  /** Default mute duration in minutes */
  DEFAULT_MUTE_DURATION_MINUTES: 10,
  
  /** Maximum mute duration in minutes (24 hours) */
  MAX_MUTE_DURATION_MINUTES: 1440,
} as const;

/**
 * Chat collection paths.
 */
export const CHAT_COLLECTIONS = {
  /** Messages subcollection */
  messages: 'messages',
  
  /** Mutes subcollection */
  mutes: 'mutes',
  
  /** Global chat bans */
  chatBans: 'chatBans',
  
  /** Moderation logs */
  moderationLogs: 'moderationLogs',
} as const;

