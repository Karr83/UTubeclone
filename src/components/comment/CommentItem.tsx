/**
 * CommentItem Component
 * 
 * Reusable comment display component based on Figma design.
 * Supports two modes:
 * - 'vod': Full comment with all actions (like YouTube comments on videos)
 * - 'live': Compact live chat style with minimal actions
 * 
 * Features:
 * - Avatar with image or initials
 * - Username with optional role badge
 * - Timestamp (relative or absolute)
 * - Comment text (with optional truncation)
 * - Action row (like, dislike, reply, menu)
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export type CommentMode = 'vod' | 'live';

export type UserRole = 'viewer' | 'member' | 'creator' | 'admin';

export interface CommentItemProps {
  /** Display mode: 'vod' for video comments, 'live' for chat */
  mode?: CommentMode;
  
  // User info
  /** User's avatar URL */
  avatarUrl?: string;
  /** Username/display name */
  username: string;
  /** User role for badge display */
  userRole?: UserRole;
  
  // Comment content
  /** Comment text */
  text: string;
  /** Timestamp - either relative string ("8 hours ago") or Date */
  timestamp: string | Date;
  
  // Engagement stats
  /** Number of likes */
  likeCount?: number;
  /** Is currently liked by viewer */
  isLiked?: boolean;
  /** Is currently disliked by viewer */
  isDisliked?: boolean;
  /** Number of replies (VOD mode) */
  replyCount?: number;
  
  // Display options
  /** Max lines for comment text (undefined = no limit) */
  maxLines?: number;
  /** Show action buttons */
  showActions?: boolean;
  /** Is this the current user's own comment */
  isOwnComment?: boolean;
  /** Is this comment pinned */
  isPinned?: boolean;
  /** Is this comment highlighted (e.g., creator heart) */
  isHighlighted?: boolean;
  
  // Callbacks
  /** Called when like button tapped */
  onLike?: () => void;
  /** Called when dislike button tapped */
  onDislike?: () => void;
  /** Called when reply button tapped */
  onReply?: () => void;
  /** Called when avatar/username tapped */
  onUserPress?: () => void;
  /** Called when more/menu button tapped */
  onMenuPress?: () => void;
  /** Called when comment is long pressed */
  onLongPress?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTimestamp(timestamp: string | Date, mode: CommentMode): string {
  if (typeof timestamp === 'string') return timestamp;
  
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Live mode: show time only for today
  if (mode === 'live') {
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // VOD mode: show relative date
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function getRoleBadge(role: UserRole): { text: string; color: string } | null {
  switch (role) {
    case 'admin':
      return { text: 'ADMIN', color: '#EF4444' };
    case 'creator':
      return { text: 'CREATOR', color: '#8B5CF6' };
    case 'member':
      return { text: 'MEMBER', color: '#22C55E' };
    default:
      return null;
  }
}

// Random pastel colors for avatar backgrounds
const AVATAR_COLORS = [
  '#F87171', // red
  '#FB923C', // orange
  '#FBBF24', // amber
  '#A3E635', // lime
  '#34D399', // emerald
  '#22D3EE', // cyan
  '#60A5FA', // blue
  '#A78BFA', // violet
  '#F472B6', // pink
  '#E879F9', // fuchsia
];

function getAvatarColor(username: string): string {
  const index = username.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CommentItem({
  mode = 'vod',
  avatarUrl,
  username,
  userRole = 'viewer',
  text,
  timestamp,
  likeCount = 0,
  isLiked = false,
  isDisliked = false,
  replyCount = 0,
  maxLines,
  showActions = true,
  isOwnComment = false,
  isPinned = false,
  isHighlighted = false,
  onLike,
  onDislike,
  onReply,
  onUserPress,
  onMenuPress,
  onLongPress,
}: CommentItemProps): JSX.Element {
  // Derived values
  const initial = useMemo(() => username.charAt(0).toUpperCase(), [username]);
  const avatarBgColor = useMemo(() => getAvatarColor(username), [username]);
  const roleBadge = useMemo(() => getRoleBadge(userRole), [userRole]);
  const formattedTime = useMemo(() => formatTimestamp(timestamp, mode), [timestamp, mode]);
  
  const isCompact = mode === 'live';
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompact && styles.containerCompact,
        isOwnComment && styles.containerOwn,
        isHighlighted && styles.containerHighlighted,
      ]}
      activeOpacity={0.8}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* Pinned indicator */}
      {isPinned && (
        <View style={styles.pinnedRow}>
          <Text style={styles.pinnedIcon}>📌</Text>
          <Text style={styles.pinnedText}>Pinned by creator</Text>
        </View>
      )}
      
      <View style={styles.mainRow}>
        {/* Avatar */}
        <TouchableOpacity
          style={[styles.avatarContainer, isCompact && styles.avatarContainerCompact]}
          onPress={onUserPress}
          disabled={!onUserPress}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={[styles.avatar, isCompact && styles.avatarCompact]} />
          ) : (
            <View style={[styles.avatarPlaceholder, isCompact && styles.avatarCompact, { backgroundColor: avatarBgColor }]}>
              <Text style={[styles.avatarInitial, isCompact && styles.avatarInitialCompact]}>
                {initial}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Header: username + timestamp */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onUserPress}
              disabled={!onUserPress}
              style={styles.usernameRow}
            >
              <Text style={[styles.username, isCompact && styles.usernameCompact]}>
                {username}
              </Text>
              
              {roleBadge && (
                <View style={[styles.roleBadge, { backgroundColor: roleBadge.color }]}>
                  <Text style={styles.roleBadgeText}>{roleBadge.text}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={[styles.timestamp, isCompact && styles.timestampCompact]}>
              {formattedTime}
            </Text>
          </View>
          
          {/* Comment text */}
          <Text
            style={[styles.text, isCompact && styles.textCompact]}
            numberOfLines={maxLines}
          >
            {text}
          </Text>
          
          {/* Actions row (VOD mode or when explicitly enabled) */}
          {showActions && !isCompact && (
            <View style={styles.actions}>
              {/* Like button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onLike}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.actionIcon, isLiked && styles.actionIconActive]}>
                  👍
                </Text>
                {likeCount > 0 && (
                  <Text style={[styles.actionCount, isLiked && styles.actionCountActive]}>
                    {formatCount(likeCount)}
                  </Text>
                )}
              </TouchableOpacity>
              
              {/* Dislike button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onDislike}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.actionIcon, isDisliked && styles.actionIconActive]}>
                  👎
                </Text>
              </TouchableOpacity>
              
              {/* Reply button */}
              <TouchableOpacity
                style={styles.replyButton}
                onPress={onReply}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.replyText}>REPLY</Text>
              </TouchableOpacity>
              
              {/* Reply count indicator */}
              {replyCount > 0 && (
                <TouchableOpacity style={styles.replyCountButton} onPress={onReply}>
                  <Text style={styles.replyCountText}>
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Menu button (VOD mode) */}
        {!isCompact && onMenuPress && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: 'transparent',
  },
  containerCompact: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  containerOwn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  containerHighlighted: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  
  // Pinned
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  pinnedIcon: {
    fontSize: 12,
  },
  pinnedText: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },
  
  // Main row
  mainRow: {
    flexDirection: 'row',
  },
  
  // Avatar
  avatarContainer: {
    marginRight: spacing[3],
  },
  avatarContainerCompact: {
    marginRight: spacing[2],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  avatarCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  avatarInitialCompact: {
    fontSize: 12,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing[1],
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  usernameCompact: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
    marginLeft: spacing[2],
  },
  timestampCompact: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  
  // Text
  text: {
    fontSize: 14,
    color: darkTheme.semantic.text,
    lineHeight: 20,
  },
  textCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[4],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
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
    marginLeft: spacing[2],
  },
  replyText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.semantic.textSecondary,
    letterSpacing: 0.3,
  },
  replyCountButton: {
    marginLeft: 'auto',
  },
  replyCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.youtube.blue,
  },
  
  // Menu
  menuButton: {
    paddingLeft: spacing[2],
    alignSelf: 'flex-start',
  },
  menuIcon: {
    fontSize: 18,
    color: darkTheme.semantic.textSecondary,
  },
});
