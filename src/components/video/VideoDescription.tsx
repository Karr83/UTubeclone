/**
 * VideoDescription Component
 * 
 * Expandable video description section for watch pages.
 * Based on Figma Video-Desc component design.
 * 
 * Features:
 * - Creator avatar + name + subscriber count
 * - Subscribe button
 * - Collapsible description text
 * - Smooth expand/collapse animation
 * - View count + upload date display
 * 
 * Usage:
 * - LiveStreamScreen (live video watch page)
 * - ReplayScreen (VOD watch page)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// TYPES
// =============================================================================

export interface VideoDescriptionProps {
  // Video metadata
  /** Video/stream title */
  title?: string;
  /** View count (number or formatted string like "1.2M views") */
  viewCount?: number | string;
  /** Upload/stream date (Date object or formatted string) */
  uploadDate?: Date | string;
  /** Description text */
  description?: string;
  
  // Creator info
  /** Creator avatar URL */
  creatorAvatarUrl?: string;
  /** Creator display name */
  creatorName: string;
  /** Subscriber count (number or formatted string) */
  subscriberCount: number | string;
  
  // State
  /** Is user subscribed to creator */
  isSubscribed?: boolean;
  /** Is description expanded by default */
  defaultExpanded?: boolean;
  
  // Callbacks
  /** Called when creator avatar/name tapped */
  onCreatorPress?: () => void;
  /** Called when subscribe button tapped */
  onSubscribePress?: () => void;
  /** Called when share button tapped (optional) */
  onSharePress?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatViewCount(count: number | string): string {
  if (typeof count === 'string') return count;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${Math.floor(count / 1_000)}K views`;
  return `${count} views`;
}

function formatSubscriberCount(count: number | string): string {
  if (typeof count === 'string') return count;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M subscribers`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K subscribers`;
  return `${count} subscribers`;
}

function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoDescription({
  title,
  viewCount,
  uploadDate,
  description,
  creatorAvatarUrl,
  creatorName,
  subscriberCount,
  isSubscribed = false,
  defaultExpanded = false,
  onCreatorPress,
  onSubscribePress,
  onSharePress,
}: VideoDescriptionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Get creator initials for avatar fallback
  const creatorInitials = creatorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Toggle expand/collapse with animation
  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);
  
  // Check if description is long enough to need truncation
  const hasLongDescription = description && description.length > 100;
  
  return (
    <View style={styles.container}>
      {/* ============================================ */}
      {/* Creator Row */}
      {/* ============================================ */}
      <View style={styles.creatorRow}>
        {/* Avatar + Info */}
        <TouchableOpacity
          style={styles.creatorInfo}
          onPress={onCreatorPress}
          activeOpacity={0.7}
        >
          {/* Avatar */}
          {creatorAvatarUrl ? (
            <Image
              source={{ uri: creatorAvatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{creatorInitials}</Text>
            </View>
          )}
          
          {/* Name + Subscribers */}
          <View style={styles.creatorTextCol}>
            {creatorName && (
              <Text style={styles.creatorName} numberOfLines={1}>
                {creatorName}
              </Text>
            )}
            <Text style={styles.subscriberCount}>
              {formatSubscriberCount(subscriberCount)}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Subscribe Button */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isSubscribed && styles.subscribedButton,
          ]}
          onPress={onSubscribePress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.subscribeText,
              isSubscribed && styles.subscribedText,
            ]}
          >
            {isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* ============================================ */}
      {/* Description Box (Expandable) */}
      {/* ============================================ */}
      <TouchableOpacity
        style={styles.descriptionBox}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        {/* Stats Row (views + date) */}
        {(viewCount !== undefined || uploadDate) && (
          <View style={styles.statsRow}>
            {viewCount !== undefined && (
              <Text style={styles.statText}>{formatViewCount(viewCount)}</Text>
            )}
            {viewCount !== undefined && uploadDate && (
              <Text style={styles.statDot}>•</Text>
            )}
            {uploadDate && (
              <Text style={styles.statText}>{formatDate(uploadDate)}</Text>
            )}
          </View>
        )}
        
        {/* Description Text */}
        {description ? (
          <Text
            style={styles.descriptionText}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {description}
          </Text>
        ) : (
          <Text style={styles.noDescription}>No description</Text>
        )}
        
        {/* Show More/Less Toggle */}
        {(hasLongDescription || isExpanded) && (
          <Text style={styles.toggleText}>
            {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
          </Text>
        )}
      </TouchableOpacity>
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
  
  // ============================================
  // Creator Row
  // ============================================
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.divider,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkTheme.youtube.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold as any,
    color: '#FFF',
  },
  creatorTextCol: {
    marginLeft: spacing[3],
    flex: 1,
  },
  creatorName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold as any,
    color: darkTheme.semantic.text,
    marginBottom: 2,
  },
  subscriberCount: {
    fontSize: typography.fontSize.sm,
    color: darkTheme.semantic.textSecondary,
  },
  
  // Subscribe Button
  subscribeButton: {
    backgroundColor: darkTheme.youtube.red,
    paddingVertical: spacing[2] + 2,
    paddingHorizontal: spacing[4],
    borderRadius: 4,
    marginLeft: spacing[3],
  },
  subscribedButton: {
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  subscribeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  subscribedText: {
    color: darkTheme.semantic.text,
  },
  
  // ============================================
  // Description Box
  // ============================================
  descriptionBox: {
    backgroundColor: darkTheme.youtube.surfaceElevated,
    marginHorizontal: spacing[4],
    marginVertical: spacing[3],
    borderRadius: 12,
    padding: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  statText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold as any,
    color: darkTheme.semantic.text,
  },
  statDot: {
    fontSize: typography.fontSize.sm,
    color: darkTheme.semantic.textSecondary,
    marginHorizontal: spacing[1],
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: darkTheme.semantic.text,
    lineHeight: 20,
  },
  noDescription: {
    fontSize: typography.fontSize.base,
    color: darkTheme.semantic.textTertiary,
    fontStyle: 'italic',
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold as any,
    color: darkTheme.semantic.textSecondary,
    marginTop: spacing[2],
    letterSpacing: 0.3,
  },
});
