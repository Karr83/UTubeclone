/**
 * Chat Container Component
 * 
 * This component provides the complete chat UI for live streams.
 * It includes message list, input, and moderation controls.
 * 
 * FEATURES:
 * - Real-time message display
 * - Send messages
 * - Delete messages (role-based)
 * - Mute/ban users (role-based)
 * - Auto-scroll to new messages
 * 
 * USAGE:
 * ```tsx
 * <ChatContainer
 *   streamId={stream.id}
 *   streamCreatorId={stream.creatorId}
 *   isStreamLive={isLive}
 * />
 * ```
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';

import { useChat } from '../../hooks/useChat';
import {
  ChatMessageDisplay,
  ChatPermissions,
  CHAT_CONFIG,
} from '../../types/chat';

// =============================================================================
// PROPS
// =============================================================================

interface ChatContainerProps {
  /** Stream ID */
  streamId: string;
  
  /** Stream creator's user ID */
  streamCreatorId: string;
  
  /** Whether the stream is currently live */
  isStreamLive: boolean;
  
  /** Optional height constraint */
  maxHeight?: number;
}

// =============================================================================
// MESSAGE ITEM COMPONENT
// =============================================================================

interface MessageItemProps {
  message: ChatMessageDisplay;
  onDelete: (messageId: string) => void;
  onMute: (userId: string, username: string) => void;
  onBan: (userId: string, username: string) => void;
  permissions: ChatPermissions;
}

function MessageItem({
  message,
  onDelete,
  onMute,
  onBan,
  permissions,
}: MessageItemProps): JSX.Element {
  const [showActions, setShowActions] = useState(false);
  
  // Get role badge color
  const getRoleBadge = () => {
    switch (message.userRole) {
      case 'admin':
        return { bg: '#EF4444', text: 'ADMIN' };
      case 'creator':
        return { bg: '#8B5CF6', text: 'CREATOR' };
      default:
        return null;
    }
  };
  
  const roleBadge = getRoleBadge();
  
  // Handle long press for actions
  const handleLongPress = () => {
    if (message.canDelete || permissions.canMute || permissions.canBan) {
      setShowActions(true);
    }
  };
  
  // Handle delete with confirmation
  const handleDelete = () => {
    Alert.alert(
      'Delete Message?',
      'This message will be removed from chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(message.id);
            setShowActions(false);
          },
        },
      ]
    );
  };
  
  // Handle mute
  const handleMute = () => {
    Alert.alert(
      `Mute ${message.username}?`,
      'They won\'t be able to send messages in this stream.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          onPress: () => {
            onMute(message.userId, message.username);
            setShowActions(false);
          },
        },
      ]
    );
  };
  
  // Handle ban (admin only)
  const handleBan = () => {
    onBan(message.userId, message.username);
    setShowActions(false);
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.messageItem,
        message.isOwnMessage && styles.ownMessage,
      ]}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      {/* Username row */}
      <View style={styles.messageHeader}>
        <Text style={styles.username}>{message.username}</Text>
        
        {roleBadge && (
          <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
            <Text style={styles.roleBadgeText}>{roleBadge.text}</Text>
          </View>
        )}
        
        <Text style={styles.timestamp}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
      
      {/* Message text */}
      <Text style={styles.messageText}>{message.message}</Text>
      
      {/* Action buttons (shown on long press) */}
      {showActions && (
        <View style={styles.actionsRow}>
          {message.canDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Text style={styles.actionButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
          
          {permissions.canMute && !message.isOwnMessage && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMute}
            >
              <Text style={styles.actionButtonText}>🔇 Mute</Text>
            </TouchableOpacity>
          )}
          
          {permissions.canBan && !message.isOwnMessage && (
            <TouchableOpacity
              style={[styles.actionButton, styles.banButton]}
              onPress={handleBan}
            >
              <Text style={styles.actionButtonText}>⛔ Ban</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowActions(false)}
          >
            <Text style={styles.actionButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ChatContainer({
  streamId,
  streamCreatorId,
  isStreamLive,
  maxHeight,
}: ChatContainerProps): JSX.Element {
  const {
    messages,
    isLoading,
    isSending,
    error,
    permissions,
    isChatEnabled,
    isConnected,
    sendMessage,
    deleteMessage,
    muteUser,
    banUser,
  } = useChat(streamId, streamCreatorId, isStreamLive);
  
  // Input state
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Handle send
  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    
    const success = await sendMessage(inputText);
    if (success) {
      setInputText('');
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, sendMessage]);
  
  // Handle delete
  const handleDelete = useCallback((messageId: string) => {
    deleteMessage(messageId);
  }, [deleteMessage]);
  
  // Handle mute
  const handleMute = useCallback((userId: string, username: string) => {
    muteUser(userId, username, 'Muted by moderator');
  }, [muteUser]);
  
  // Handle ban
  const handleBan = useCallback((userId: string, username: string) => {
    Alert.prompt(
      'Ban Reason',
      `Enter reason for banning ${username}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: (reason) => {
            if (reason?.trim()) {
              banUser(userId, username, reason.trim());
            } else {
              Alert.alert('Error', 'Please provide a ban reason.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  }, [banUser]);
  
  // Render message item
  const renderMessage = useCallback(({ item }: { item: ChatMessageDisplay }) => (
    <MessageItem
      message={item}
      onDelete={handleDelete}
      onMute={handleMute}
      onBan={handleBan}
      permissions={permissions}
    />
  ), [handleDelete, handleMute, handleBan, permissions]);
  
  // ---------------------------------------------------------------------------
  // RENDER: CHAT DISABLED
  // ---------------------------------------------------------------------------
  
  if (!isChatEnabled) {
    return (
      <View style={[styles.container, maxHeight && { maxHeight }]}>
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledEmoji}>💬</Text>
          <Text style={styles.disabledText}>
            Chat is available when the stream is live
          </Text>
        </View>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------
  
  if (isLoading) {
    return (
      <View style={[styles.container, maxHeight && { maxHeight }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: MAIN CHAT
  // ---------------------------------------------------------------------------
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, maxHeight && { maxHeight }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Live Chat</Text>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              isConnected ? styles.connectedDot : styles.disconnectedDot,
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>
      
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
          </View>
        }
      />
      
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
      
      {/* Restriction Notice */}
      {!permissions.canSend && permissions.restrictionReason && (
        <View style={styles.restrictionNotice}>
          <Text style={styles.restrictionText}>
            {getRestrictionMessage(permissions.restrictionReason)}
          </Text>
        </View>
      )}
      
      {/* Input Area */}
      {permissions.canSend ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Send a message..."
            placeholderTextColor="#999"
            maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isSending}
          />
          
          {/* Character count */}
          {inputText.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH - 50 && (
            <Text style={styles.charCount}>
              {inputText.length}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
            </Text>
          )}
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getRestrictionMessage(reason: string): string {
  const messages: Record<string, string> = {
    not_authenticated: '🔒 Sign in to chat',
    suspended: '⚠️ Your account is suspended',
    muted: '🔇 You are muted in this chat',
    banned: '⛔ You are banned from chat',
    stream_offline: '📺 Chat available when stream is live',
  };
  return messages[reason] || 'Cannot send messages';
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#22C55E',
  },
  disconnectedDot: {
    backgroundColor: '#F59E0B',
  },
  connectionText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  
  // Disabled
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disabledEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  disabledText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Messages
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 12,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  
  // Message Item
  messageItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ownMessage: {
    backgroundColor: '#1E40AF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  roleBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 11,
    marginLeft: 'auto',
  },
  messageText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Actions
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  banButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  
  // Error
  errorContainer: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
  
  // Restriction Notice
  restrictionNotice: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  restrictionText: {
    color: '#F59E0B',
    fontSize: 13,
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    marginRight: 8,
  },
  charCount: {
    position: 'absolute',
    right: 80,
    color: '#F59E0B',
    fontSize: 10,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

