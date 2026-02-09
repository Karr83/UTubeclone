/**
 * CommentItem Component
 * 
 * Single comment with avatar, username, timestamp, text, and actions.
 * Used within CommentsPreview or full comments list.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface CommentItemProps {
  /** Commenter avatar URL */
  avatarUrl?: string;
  /** Commenter username/display name */
  username: string;
  /** Relative timestamp (e.g., "8 hours ago") */
  timestamp: string;
  /** Comment text */
  text: string;
  /** Number of likes on comment */
  likeCount?: number;
  /** Is comment liked by current user */
  isLiked?: boolean;
  /** Callback when like tapped */
  onLike?: () => void;
  /** Callback when dislike tapped */
  onDislike?: () => void;
  /** Callback when reply tapped */
  onReply?: () => void;
  /** Callback when avatar/username tapped */
  onUserPress?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CommentItem({
  avatarUrl,
  username,
  timestamp,
  text,
  likeCount = 0,
  isLiked = false,
  onLike,
  onDislike,
  onReply,
  onUserPress,
}: CommentItemProps): JSX.Element {
  const initial = username.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <TouchableOpacity onPress={onUserPress}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onUserPress}>
            <Text style={styles.username}>{username}</Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <Text style={styles.text}>{text}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Text style={[styles.actionIcon, isLiked && styles.actionIconActive]}>👍</Text>
            {likeCount > 0 && (
              <Text style={[styles.actionCount, isLiked && styles.actionCountActive]}>
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDislike}>
            <Text style={styles.actionIcon}>👎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.replyButton} onPress={onReply}>
            <Text style={styles.replyText}>REPLY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C4DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  timestamp: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },
  text: {
    fontSize: 14,
    color: darkTheme.semantic.text,
    marginTop: 4,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionIconActive: {
    opacity: 1,
  },
  actionCount: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },
  actionCountActive: {
    color: darkTheme.youtube.blue,
  },
  replyButton: {
    marginLeft: 8,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.semantic.textSecondary,
    letterSpacing: 0.3,
  },
});
