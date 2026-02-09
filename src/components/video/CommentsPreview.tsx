/**
 * CommentsPreview Component
 * 
 * Comments section header with count, sort, input field, and comment list.
 * Used on video watch pages for displaying comments.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { darkTheme } from '../../theme';
import { CommentItem } from './CommentItem';

// =============================================================================
// TYPES
// =============================================================================

interface Comment {
  /** Unique comment ID */
  id: string;
  /** Commenter avatar URL */
  avatarUrl?: string;
  /** Commenter username */
  username: string;
  /** Relative timestamp */
  timestamp: string;
  /** Comment text */
  text: string;
  /** Like count */
  likeCount?: number;
}

interface CommentsPreviewProps {
  /** Total comment count */
  commentCount: number;
  /** Array of comments to display */
  comments: Comment[];
  /** Current user's avatar URL */
  userAvatarUrl?: string;
  /** Callback when sort button tapped */
  onSortPress?: () => void;
  /** Callback when comment input tapped */
  onInputPress?: () => void;
  /** Callback when a comment is liked */
  onCommentLike?: (id: string) => void;
  /** Callback when reply is tapped */
  onCommentReply?: (id: string) => void;
  /** Callback when commenter avatar/name is tapped */
  onCommentUserPress?: (id: string) => void;
  /** Callback when "View all" is tapped */
  onViewAll?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.floor(count / 1_000)}K`;
  return `${count}`;
};

// =============================================================================
// COMPONENT
// =============================================================================

export function CommentsPreview({
  commentCount,
  comments,
  userAvatarUrl,
  onSortPress,
  onInputPress,
  onCommentLike,
  onCommentReply,
  onCommentUserPress,
  onViewAll,
}: CommentsPreviewProps): JSX.Element {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{formatCount(commentCount)} Comments</Text>
        <TouchableOpacity style={styles.sortButton} onPress={onSortPress}>
          <Text style={styles.sortIcon}>⇅</Text>
          <Text style={styles.sortText}>SORT BY</Text>
        </TouchableOpacity>
      </View>

      {/* Input Row */}
      <TouchableOpacity style={styles.inputRow} onPress={onInputPress}>
        {userAvatarUrl ? (
          <Image source={{ uri: userAvatarUrl }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarIcon}>👤</Text>
          </View>
        )}
        <View style={styles.inputField}>
          <Text style={styles.inputPlaceholder}>Add a public comment...</Text>
        </View>
      </TouchableOpacity>

      {/* Comments List */}
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          avatarUrl={comment.avatarUrl}
          username={comment.username}
          timestamp={comment.timestamp}
          text={comment.text}
          likeCount={comment.likeCount}
          onLike={() => onCommentLike?.(comment.id)}
          onReply={() => onCommentReply?.(comment.id)}
          onUserPress={() => onCommentUserPress?.(comment.id)}
        />
      ))}

      {/* View All Button */}
      {commentCount > comments.length && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>
            View all {formatCount(commentCount)} comments
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.semantic.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: darkTheme.semantic.divider,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortIcon: {
    fontSize: 16,
    color: darkTheme.semantic.text,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.semantic.text,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.divider,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkTheme.youtube.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarIcon: {
    fontSize: 18,
  },
  inputField: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.border,
  },
  inputPlaceholder: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.youtube.blue,
  },
});
