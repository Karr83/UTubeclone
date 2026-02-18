/**
 * Chat Service
 * 
 * This service handles all chat operations for live streams including:
 * - Sending messages
 * - Real-time message subscriptions
 * - Message deletion
 * - Permission checking
 * 
 * FIRESTORE STRUCTURE:
 * ====================
 * /streams/{streamId}/messages/{messageId}  - Chat messages
 * /streams/{streamId}/mutes/{oderId}        - Stream-specific mutes
 * /chatBans/{userId}                        - Global chat bans
 * /moderationLogs/{logId}                   - Moderation action logs
 * 
 * REAL-TIME UPDATES:
 * ==================
 * Uses Firestore onSnapshot for real-time message streaming.
 * Messages are ordered by createdAt descending (newest first).
 * 
 * SECURITY:
 * =========
 * - All write operations require authentication
 * - Users cannot send if suspended, muted, or banned
 * - Only moderators (creator/admin) can delete messages
 * - All moderation actions are logged
 */

/* PHASE 2: Firebase imports commented out
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
*/

// PHASE 3B: Import real Firebase functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore, auth } from '../config/firebase';
import {
  ChatMessage,
  SendMessageData,
  StreamMute,
  ChatBan,
  ChatPermissions,
  ModerationLogEntry,
  ModerationAction,
  ChatQueryOptions,
  CHAT_CONFIG,
  CHAT_COLLECTIONS,
} from '../types/chat';

// =============================================================================
// MESSAGE OPERATIONS
// =============================================================================

/**
 * Send a chat message.
 * 
 * FLOW:
 * 1. Validate user permissions
 * 2. Check message content
 * 3. Create message document
 * 4. Real-time listeners pick up the new message
 * 
 * @param data - Message data
 * @param userId - Sender's user ID
 * @param username - Sender's display name
 * @param userRole - Sender's role
 * @param avatarUrl - Sender's avatar (optional)
 * @returns The created message
 */
export async function sendMessage(
  data: SendMessageData,
  userId: string,
  username: string,
  userRole: 'user' | 'creator' | 'admin',
  avatarUrl?: string
): Promise<ChatMessage> {
  // Validate message length
  if (!data.message.trim()) {
    throw new Error('Message cannot be empty');
  }
  
  if (data.message.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
    throw new Error(`Message too long. Maximum ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters.`);
  }
  
  // Create message document
  const messagesRef = collection(
    firestore,
    'streams',
    data.streamId,
    CHAT_COLLECTIONS.messages
  );
  
  const messageData = {
    streamId: data.streamId,
    userId,
    username,
    avatarUrl: avatarUrl || null,
    userRole,
    message: data.message.trim(),
    createdAt: serverTimestamp(),
    isDeleted: false,
  };
  
  const docRef = await addDoc(messagesRef, messageData);
  
  return {
    id: docRef.id,
    ...messageData,
    createdAt: new Date(),
  } as ChatMessage;
}

/**
 * Get recent messages for a stream.
 */
export async function getMessages(
  streamId: string,
  options: ChatQueryOptions = {}
): Promise<ChatMessage[]> {
  const { limit: queryLimit = 50, includeDeleted = false } = options;
  
  const messagesRef = collection(firestore, 'streams', streamId, CHAT_COLLECTIONS.messages);
  
  let q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(queryLimit)
  );
  
  // Filter deleted messages client-side to avoid composite index dependency while index is building
  
  const snapshot = await getDocs(q);
  
  const messages = snapshot.docs.map((doc) => docToMessage(doc.id, doc.data()));
  const filtered = includeDeleted ? messages : messages.filter((msg) => !msg.isDeleted);
  return filtered.reverse();
}

/**
 * Subscribe to real-time chat messages.
 * 
 * @param streamId - Stream to subscribe to
 * @param callback - Function called with updated messages
 * @param options - Query options
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  streamId: string,
  callback: (messages: ChatMessage[]) => void,
  options: ChatQueryOptions = {}
): Unsubscribe {
  const { limit: queryLimit = CHAT_CONFIG.MAX_MESSAGES_DISPLAY } = options;
  
  const messagesRef = collection(firestore, 'streams', streamId, CHAT_COLLECTIONS.messages);
  
  // Query by createdAt only; filter deleted client-side to avoid temporary index-building errors
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(queryLimit)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => docToMessage(doc.id, doc.data()))
      .filter((msg) => !msg.isDeleted)
      .reverse(); // Reverse to show oldest first
    
    callback(messages);
  }, (error) => {
    console.error('[ChatService] Subscription error:', error);
    callback([]);
  });
}

/**
 * Delete a message (soft delete).
 * 
 * @param streamId - Stream ID
 * @param messageId - Message to delete
 * @param moderatorId - Who is deleting
 * @param reason - Reason for deletion
 */
export async function deleteMessage(
  streamId: string,
  messageId: string,
  moderatorId: string,
  reason?: string
): Promise<void> {
  const messageRef = doc(
    firestore,
    'streams',
    streamId,
    CHAT_COLLECTIONS.messages,
    messageId
  );
  
  // Soft delete - mark as deleted but keep the document
  await updateDoc(messageRef, {
    isDeleted: true,
    deletedBy: moderatorId,
    deletedAt: serverTimestamp(),
    deletionReason: reason || 'Removed by moderator',
  });
}

/**
 * Get a single message by ID.
 */
export async function getMessage(
  streamId: string,
  messageId: string
): Promise<ChatMessage | null> {
  const messageRef = doc(
    firestore,
    'streams',
    streamId,
    CHAT_COLLECTIONS.messages,
    messageId
  );
  
  const snapshot = await getDoc(messageRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return docToMessage(snapshot.id, snapshot.data());
}

// =============================================================================
// MUTE OPERATIONS (Stream-specific)
// =============================================================================

/**
 * Mute a user in a specific stream.
 * Only the stream creator can mute users.
 * 
 * @param streamId - Stream ID
 * @param targetUserId - User to mute
 * @param targetUsername - Username of muted user
 * @param mutedBy - Creator's user ID
 * @param reason - Reason for mute
 * @param durationMinutes - Mute duration (null = permanent for stream)
 */
export async function muteUser(
  streamId: string,
  targetUserId: string,
  targetUsername: string,
  mutedBy: string,
  reason?: string,
  durationMinutes?: number
): Promise<StreamMute> {
  const muteRef = doc(
    firestore,
    'streams',
    streamId,
    CHAT_COLLECTIONS.mutes,
    targetUserId
  );
  
  const expiresAt = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60 * 1000)
    : null;
  
  const muteData: Omit<StreamMute, 'id'> = {
    streamId,
    oderId: targetUserId,
    username: targetUsername,
    mutedBy,
    mutedAt: new Date(),
    expiresAt,
    reason: reason || 'Muted by streamer',
  };
  
  await setDoc(muteRef, {
    ...muteData,
    mutedAt: serverTimestamp(),
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
  });
  
  // Log the moderation action
  await logModerationAction({
    action: 'mute_user',
    streamId,
    targetUserId,
    targetUsername,
    moderatorId: mutedBy,
    moderatorRole: 'creator',
    reason,
  });
  
  return {
    id: targetUserId,
    ...muteData,
  };
}

/**
 * Unmute a user in a stream.
 */
export async function unmuteUser(
  streamId: string,
  targetUserId: string,
  unmutedBy: string
): Promise<void> {
  const muteRef = doc(
    firestore,
    'streams',
    streamId,
    CHAT_COLLECTIONS.mutes,
    targetUserId
  );
  
  // Get mute info for logging
  const muteSnap = await getDoc(muteRef);
  const username = muteSnap.exists() ? muteSnap.data().username : 'Unknown';
  
  await deleteDoc(muteRef);
  
  // Log the moderation action
  await logModerationAction({
    action: 'unmute_user',
    streamId,
    targetUserId,
    targetUsername: username,
    moderatorId: unmutedBy,
    moderatorRole: 'creator',
  });
}

/**
 * Check if a user is muted in a stream.
 */
export async function isUserMuted(
  streamId: string,
  userId: string
): Promise<boolean> {
  const muteRef = doc(
    firestore,
    'streams',
    streamId,
    CHAT_COLLECTIONS.mutes,
    userId
  );
  
  const muteSnap = await getDoc(muteRef);
  
  if (!muteSnap.exists()) {
    return false;
  }
  
  const muteData = muteSnap.data();
  
  // Check if mute has expired
  if (muteData.expiresAt) {
    const expiresAt = muteData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      // Mute expired, clean it up
      await deleteDoc(muteRef);
      return false;
    }
  }
  
  return true;
}

/**
 * Get all muted users in a stream.
 */
export async function getMutedUsers(streamId: string): Promise<StreamMute[]> {
  const mutesRef = collection(firestore, 'streams', streamId, CHAT_COLLECTIONS.mutes);
  const snapshot = await getDocs(mutesRef);
  
  const mutes: StreamMute[] = [];
  const now = new Date();
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const expiresAt = data.expiresAt?.toDate();
    
    // Skip expired mutes
    if (expiresAt && expiresAt < now) {
      // Clean up expired mute
      await deleteDoc(docSnap.ref);
      continue;
    }
    
    mutes.push({
      id: docSnap.id,
      streamId: data.streamId,
      oderId: data.oderId,
      username: data.username,
      mutedBy: data.mutedBy,
      mutedAt: data.mutedAt?.toDate() || new Date(),
      expiresAt,
      reason: data.reason,
    });
  }
  
  return mutes;
}

// =============================================================================
// BAN OPERATIONS (Global)
// =============================================================================

/**
 * Ban a user from all chat (admin only).
 */
export async function banUser(
  targetUserId: string,
  targetUsername: string,
  bannedBy: string,
  reason: string,
  durationDays?: number
): Promise<ChatBan> {
  const banRef = doc(firestore, CHAT_COLLECTIONS.chatBans, targetUserId);
  
  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;
  
  const banData: ChatBan = {
    userId: targetUserId,
    username: targetUsername,
    bannedBy,
    bannedAt: new Date(),
    expiresAt,
    reason,
    isActive: true,
  };
  
  await setDoc(banRef, {
    ...banData,
    bannedAt: serverTimestamp(),
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
  });
  
  // Log the moderation action
  await logModerationAction({
    action: 'ban_user',
    targetUserId,
    targetUsername,
    moderatorId: bannedBy,
    moderatorRole: 'admin',
    reason,
  });
  
  return banData;
}

/**
 * Unban a user.
 */
export async function unbanUser(
  targetUserId: string,
  unbannedBy: string
): Promise<void> {
  const banRef = doc(firestore, CHAT_COLLECTIONS.chatBans, targetUserId);
  
  // Get ban info for logging
  const banSnap = await getDoc(banRef);
  const username = banSnap.exists() ? banSnap.data().username : 'Unknown';
  
  await updateDoc(banRef, {
    isActive: false,
  });
  
  // Log the moderation action
  await logModerationAction({
    action: 'unban_user',
    targetUserId,
    targetUsername: username,
    moderatorId: unbannedBy,
    moderatorRole: 'admin',
  });
}

/**
 * Check if a user is banned from chat.
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const banRef = doc(firestore, CHAT_COLLECTIONS.chatBans, userId);
  const banSnap = await getDoc(banRef);
  
  if (!banSnap.exists()) {
    return false;
  }
  
  const banData = banSnap.data();
  
  if (!banData.isActive) {
    return false;
  }
  
  // Check if ban has expired
  if (banData.expiresAt) {
    const expiresAt = banData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      // Ban expired, update it
      await updateDoc(banRef, { isActive: false });
      return false;
    }
  }
  
  return true;
}

// =============================================================================
// PERMISSION CHECKING
// =============================================================================

/**
 * Get chat permissions for a user in a stream.
 * 
 * @param userId - User ID (null if not authenticated)
 * @param userRole - User's role
 * @param userStatus - User's account status
 * @param streamId - Stream ID
 * @param streamCreatorId - Stream creator's ID
 * @param isStreamLive - Whether stream is currently live
 */
export async function getChatPermissions(
  userId: string | null,
  userRole: 'user' | 'creator' | 'admin' | null,
  userStatus: string | null,
  streamId: string,
  streamCreatorId: string,
  isStreamLive: boolean
): Promise<ChatPermissions> {
  // Not authenticated
  if (!userId) {
    return {
      canSend: false,
      canDeleteOwn: false,
      canDeleteAny: false,
      canMute: false,
      canBan: false,
      restrictionReason: 'not_authenticated',
    };
  }
  
  // Stream not live
  if (!isStreamLive) {
    return {
      canSend: false,
      canDeleteOwn: false,
      canDeleteAny: false,
      canMute: false,
      canBan: false,
      restrictionReason: 'stream_offline',
    };
  }
  
  // Check if user is suspended
  if (userStatus === 'suspended') {
    return {
      canSend: false,
      canDeleteOwn: false,
      canDeleteAny: false,
      canMute: false,
      canBan: false,
      restrictionReason: 'suspended',
    };
  }
  
  // Check if user is globally banned
  const isBanned = await isUserBanned(userId);
  if (isBanned) {
    return {
      canSend: false,
      canDeleteOwn: false,
      canDeleteAny: false,
      canMute: false,
      canBan: false,
      restrictionReason: 'banned',
    };
  }
  
  // Check if user is muted in this stream
  const isMuted = await isUserMuted(streamId, userId);
  if (isMuted) {
    return {
      canSend: false,
      canDeleteOwn: false,
      canDeleteAny: false,
      canMute: false,
      canBan: false,
      restrictionReason: 'muted',
    };
  }
  
  // Admin permissions
  if (userRole === 'admin') {
    return {
      canSend: true,
      canDeleteOwn: true,
      canDeleteAny: true,
      canMute: true,
      canBan: true,
    };
  }
  
  // Creator permissions (in their own stream)
  if (userRole === 'creator' && userId === streamCreatorId) {
    return {
      canSend: true,
      canDeleteOwn: true,
      canDeleteAny: true,
      canMute: true,
      canBan: false, // Only admins can ban globally
    };
  }
  
  // Regular user permissions
  return {
    canSend: true,
    canDeleteOwn: true,
    canDeleteAny: false,
    canMute: false,
    canBan: false,
  };
}

// =============================================================================
// MODERATION LOGGING
// =============================================================================

/**
 * Log a moderation action.
 */
async function logModerationAction(data: Omit<ModerationLogEntry, 'id' | 'timestamp'>): Promise<void> {
  const logsRef = collection(firestore, CHAT_COLLECTIONS.moderationLogs);
  
  await addDoc(logsRef, {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/**
 * Log a message deletion.
 */
export async function logMessageDeletion(
  streamId: string,
  messageId: string,
  targetUserId: string,
  targetUsername: string,
  moderatorId: string,
  moderatorRole: 'creator' | 'admin',
  reason?: string
): Promise<void> {
  await logModerationAction({
    action: 'delete_message',
    streamId,
    messageId,
    targetUserId,
    targetUsername,
    moderatorId,
    moderatorRole,
    reason,
  });
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert Firestore document to ChatMessage.
 */
function docToMessage(docId: string, data: any): ChatMessage {
  return {
    id: docId,
    streamId: data.streamId,
    userId: data.userId,
    username: data.username,
    avatarUrl: data.avatarUrl,
    userRole: data.userRole || 'user',
    message: data.message,
    createdAt: data.createdAt?.toDate() || new Date(),
    isDeleted: data.isDeleted || false,
    deletedBy: data.deletedBy,
    deletedAt: data.deletedAt?.toDate(),
    deletionReason: data.deletionReason,
  };
}

