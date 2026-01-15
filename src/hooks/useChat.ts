/**
 * useChat Hook
 * 
 * This hook provides real-time chat functionality for live streams.
 * It handles message subscription, sending, and moderation actions.
 * 
 * USAGE:
 * ```tsx
 * const {
 *   messages,
 *   permissions,
 *   isChatEnabled,
 *   sendMessage,
 *   deleteMessage,
 *   muteUser,
 * } = useChat(streamId, streamCreatorId, isStreamLive);
 * ```
 * 
 * FEATURES:
 * - Real-time message updates via Firestore
 * - Permission-based actions
 * - Rate limiting (1 message per second)
 * - Moderation tools for creators/admins
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import {
  ChatMessage,
  ChatMessageDisplay,
  ChatPermissions,
  StreamMute,
  CHAT_CONFIG,
} from '../types/chat';
import {
  sendMessage as sendMessageService,
  subscribeToMessages,
  deleteMessage as deleteMessageService,
  muteUser as muteUserService,
  unmuteUser as unmuteUserService,
  banUser as banUserService,
  getChatPermissions,
  getMutedUsers as getMutedUsersService,
  getMessage,
  logMessageDeletion,
} from '../services/chat.service';

// =============================================================================
// TYPES
// =============================================================================

interface UseChatResult {
  /** Chat messages with display metadata */
  messages: ChatMessageDisplay[];
  
  /** Whether messages are loading */
  isLoading: boolean;
  
  /** Whether currently sending a message */
  isSending: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Current user's permissions */
  permissions: ChatPermissions;
  
  /** Whether chat is enabled (stream is live) */
  isChatEnabled: boolean;
  
  /** Whether chat is connected */
  isConnected: boolean;
  
  /** Send a message */
  sendMessage: (text: string) => Promise<boolean>;
  
  /** Delete a message */
  deleteMessage: (messageId: string, reason?: string) => Promise<boolean>;
  
  /** Mute a user in this stream */
  muteUser: (userId: string, username: string, reason?: string, durationMinutes?: number) => Promise<boolean>;
  
  /** Unmute a user */
  unmuteUser: (userId: string) => Promise<boolean>;
  
  /** Ban a user globally (admin only) */
  banUser: (userId: string, username: string, reason: string) => Promise<boolean>;
  
  /** Get list of muted users */
  getMutedUsers: () => Promise<StreamMute[]>;
  
  /** Refresh permissions */
  refreshPermissions: () => Promise<void>;
}

interface UseChatOptions {
  /** Maximum messages to keep in memory */
  maxMessages?: number;
}

// =============================================================================
// HOOK
// =============================================================================

export function useChat(
  streamId: string | null,
  streamCreatorId: string | null,
  isStreamLive: boolean,
  options: UseChatOptions = {}
): UseChatResult {
  const { maxMessages = CHAT_CONFIG.MAX_MESSAGES_DISPLAY } = options;
  
  const { user, role, profile } = useAuth();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [permissions, setPermissions] = useState<ChatPermissions>({
    canSend: false,
    canDeleteOwn: false,
    canDeleteAny: false,
    canMute: false,
    canBan: false,
    restrictionReason: 'stream_offline',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Rate limiting ref
  const lastMessageTime = useRef<number>(0);
  
  // Derived state
  const isChatEnabled = isStreamLive && !!streamId;
  
  // ---------------------------------------------------------------------------
  // LOAD PERMISSIONS
  // ---------------------------------------------------------------------------
  
  const loadPermissions = useCallback(async () => {
    if (!streamId || !streamCreatorId) {
      setPermissions({
        canSend: false,
        canDeleteOwn: false,
        canDeleteAny: false,
        canMute: false,
        canBan: false,
        restrictionReason: 'stream_offline',
      });
      return;
    }
    
    try {
      const perms = await getChatPermissions(
        user?.uid || null,
        role,
        profile?.status || null,
        streamId,
        streamCreatorId,
        isStreamLive
      );
      setPermissions(perms);
    } catch (err) {
      console.error('[useChat] Failed to load permissions:', err);
    }
  }, [streamId, streamCreatorId, user?.uid, role, profile?.status, isStreamLive]);
  
  // Load permissions on mount and when dependencies change
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);
  
  // ---------------------------------------------------------------------------
  // SUBSCRIBE TO MESSAGES
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!streamId || !isChatEnabled) {
      setMessages([]);
      setIsLoading(false);
      setIsConnected(false);
      return;
    }
    
    setIsLoading(true);
    
    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(
      streamId,
      (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
        setIsConnected(true);
        setError(null);
      },
      { limit: maxMessages }
    );
    
    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [streamId, isChatEnabled, maxMessages]);
  
  // ---------------------------------------------------------------------------
  // SEND MESSAGE
  // ---------------------------------------------------------------------------
  
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!user?.uid || !streamId) {
      Alert.alert('Error', 'You must be signed in to chat.');
      return false;
    }
    
    if (!permissions.canSend) {
      const reasonMessages: Record<string, string> = {
        not_authenticated: 'You must be signed in to chat.',
        suspended: 'Your account is suspended.',
        muted: 'You are muted in this chat.',
        banned: 'You are banned from chat.',
        stream_offline: 'Chat is only available when the stream is live.',
      };
      Alert.alert('Cannot Send', reasonMessages[permissions.restrictionReason || ''] || 'You cannot send messages.');
      return false;
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTime.current < CHAT_CONFIG.MESSAGE_COOLDOWN_MS) {
      Alert.alert('Slow Down', 'Please wait before sending another message.');
      return false;
    }
    
    // Validate message
    const trimmedText = text.trim();
    if (!trimmedText) {
      return false;
    }
    
    if (trimmedText.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
      Alert.alert('Message Too Long', `Maximum ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters.`);
      return false;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      await sendMessageService(
        { streamId, message: trimmedText },
        user.uid,
        profile?.displayName || profile?.email?.split('@')[0] || 'User',
        role || 'user',
        profile?.photoURL
      );
      
      lastMessageTime.current = now;
      return true;
    } catch (err: any) {
      console.error('[useChat] Send error:', err);
      setError(err.message || 'Failed to send message');
      Alert.alert('Error', err.message || 'Failed to send message.');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [user?.uid, streamId, permissions, profile, role]);
  
  // ---------------------------------------------------------------------------
  // DELETE MESSAGE
  // ---------------------------------------------------------------------------
  
  const deleteMessage = useCallback(async (
    messageId: string,
    reason?: string
  ): Promise<boolean> => {
    if (!user?.uid || !streamId) {
      return false;
    }
    
    // Get the message to check ownership
    const message = messages.find((m) => m.id === messageId);
    
    if (!message) {
      Alert.alert('Error', 'Message not found.');
      return false;
    }
    
    // Check permissions
    const isOwnMessage = message.userId === user.uid;
    if (!isOwnMessage && !permissions.canDeleteAny) {
      Alert.alert('Error', 'You do not have permission to delete this message.');
      return false;
    }
    
    try {
      await deleteMessageService(streamId, messageId, user.uid, reason);
      
      // Log the deletion
      await logMessageDeletion(
        streamId,
        messageId,
        message.userId,
        message.username,
        user.uid,
        role === 'admin' ? 'admin' : 'creator',
        reason
      );
      
      return true;
    } catch (err: any) {
      console.error('[useChat] Delete error:', err);
      Alert.alert('Error', err.message || 'Failed to delete message.');
      return false;
    }
  }, [user?.uid, streamId, messages, permissions, role]);
  
  // ---------------------------------------------------------------------------
  // MUTE USER
  // ---------------------------------------------------------------------------
  
  const muteUser = useCallback(async (
    targetUserId: string,
    targetUsername: string,
    reason?: string,
    durationMinutes?: number
  ): Promise<boolean> => {
    if (!user?.uid || !streamId) {
      return false;
    }
    
    if (!permissions.canMute) {
      Alert.alert('Error', 'You do not have permission to mute users.');
      return false;
    }
    
    // Can't mute yourself
    if (targetUserId === user.uid) {
      Alert.alert('Error', 'You cannot mute yourself.');
      return false;
    }
    
    try {
      await muteUserService(
        streamId,
        targetUserId,
        targetUsername,
        user.uid,
        reason,
        durationMinutes || CHAT_CONFIG.DEFAULT_MUTE_DURATION_MINUTES
      );
      
      Alert.alert('User Muted', `${targetUsername} has been muted.`);
      return true;
    } catch (err: any) {
      console.error('[useChat] Mute error:', err);
      Alert.alert('Error', err.message || 'Failed to mute user.');
      return false;
    }
  }, [user?.uid, streamId, permissions]);
  
  // ---------------------------------------------------------------------------
  // UNMUTE USER
  // ---------------------------------------------------------------------------
  
  const unmuteUser = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user?.uid || !streamId) {
      return false;
    }
    
    if (!permissions.canMute) {
      Alert.alert('Error', 'You do not have permission to unmute users.');
      return false;
    }
    
    try {
      await unmuteUserService(streamId, targetUserId, user.uid);
      Alert.alert('User Unmuted', 'User has been unmuted.');
      return true;
    } catch (err: any) {
      console.error('[useChat] Unmute error:', err);
      Alert.alert('Error', err.message || 'Failed to unmute user.');
      return false;
    }
  }, [user?.uid, streamId, permissions]);
  
  // ---------------------------------------------------------------------------
  // BAN USER (Global - Admin Only)
  // ---------------------------------------------------------------------------
  
  const banUser = useCallback(async (
    targetUserId: string,
    targetUsername: string,
    reason: string
  ): Promise<boolean> => {
    if (!user?.uid) {
      return false;
    }
    
    if (!permissions.canBan) {
      Alert.alert('Error', 'Only admins can ban users globally.');
      return false;
    }
    
    // Confirm ban
    return new Promise((resolve) => {
      Alert.alert(
        'Ban User?',
        `This will ban ${targetUsername} from all chat across the platform.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Ban',
            style: 'destructive',
            onPress: async () => {
              try {
                await banUserService(
                  targetUserId,
                  targetUsername,
                  user.uid,
                  reason
                );
                Alert.alert('User Banned', `${targetUsername} has been banned from chat.`);
                resolve(true);
              } catch (err: any) {
                console.error('[useChat] Ban error:', err);
                Alert.alert('Error', err.message || 'Failed to ban user.');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }, [user?.uid, permissions]);
  
  // ---------------------------------------------------------------------------
  // GET MUTED USERS
  // ---------------------------------------------------------------------------
  
  const getMutedUsers = useCallback(async (): Promise<StreamMute[]> => {
    if (!streamId) {
      return [];
    }
    
    try {
      return await getMutedUsersService(streamId);
    } catch (err) {
      console.error('[useChat] Get muted users error:', err);
      return [];
    }
  }, [streamId]);
  
  // ---------------------------------------------------------------------------
  // MESSAGES WITH DISPLAY METADATA
  // ---------------------------------------------------------------------------
  
  const messagesWithDisplay = useMemo<ChatMessageDisplay[]>(() => {
    return messages.map((msg) => ({
      ...msg,
      canDelete: msg.userId === user?.uid ? permissions.canDeleteOwn : permissions.canDeleteAny,
      isOwnMessage: msg.userId === user?.uid,
      isMutedUser: false, // Would need to check against muted list
    }));
  }, [messages, user?.uid, permissions]);
  
  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  
  return {
    messages: messagesWithDisplay,
    isLoading,
    isSending,
    error,
    permissions,
    isChatEnabled,
    isConnected,
    sendMessage,
    deleteMessage,
    muteUser,
    unmuteUser,
    banUser,
    getMutedUsers,
    refreshPermissions: loadPermissions,
  };
}

export default useChat;

