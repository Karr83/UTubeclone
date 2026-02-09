/**
 * VideoCard Component
 * 
 * Unified video card for all video list contexts.
 * Supports three variants via props:
 * - feed: Content from home feed (uploads)
 * - live: Currently live streams
 * - recording: VOD/replay videos
 * 
 * Based on Figma Video component design.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';
import { ThumbnailImage } from '../thumbnail';

// =============================================================================
// TYPES
// =============================================================================

export type VideoCardVariant = 'feed' | 'live' | 'recording';

export interface VideoCardProps {
  /** Card display variant */
  variant?: VideoCardVariant;
  
  // Content
  /** Unique ID */
  id: string;
  /** Video/stream title */
  title: string;
  /** Thumbnail image URL */
  thumbnailUrl?: string;
  /** Video duration formatted (e.g., "23:45") - for feed/recording */
  duration?: string;
  
  // Creator info
  /** Creator display name */
  creatorName?: string;
  /** Creator ID (fallback for name) */
  creatorId?: string;
  /** Creator avatar URL */
  creatorAvatarUrl?: string;
  
  // Metadata
  /** View count */
  viewCount?: number;
  /** Relative timestamp (e.g., "3 years ago") or Date */
  timestamp?: string | Date;
  /** Current viewer count (live streams) */
  viewerCount?: number;
  
  // Badges & state
  /** Is this members-only content */
  isMembersOnly?: boolean;
  /** Is content boosted */
  isBoosted?: boolean;
  /** Boost level (1-5) */
  boostLevel?: number;
  /** Media type: video or image */
  mediaType?: 'video' | 'image' | 'audio_only' | 'avatar';
  /** Is content currently processing */
  isProcessing?: boolean;
  /** Is content locked (can't view) */
  isLocked?: boolean;
  
  // Callbacks
  /** Called when card is pressed */
  onPress?: () => void;
  /** Called when creator avatar/name is pressed */
  onCreatorPress?: () => void;
  /** Called when more (kebab) button is pressed */
  onMorePress?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatRelativeDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;

  return `${Math.floor(diffDays / 365)}y ago`;
}

function getMediaEmoji(mediaType?: string, variant?: VideoCardVariant): string {
  if (variant === 'live') {
    if (mediaType === 'audio_only') return '🎙️';
    if (mediaType === 'avatar') return '🎭';
    return '📹';
  }
  if (mediaType === 'image') return '📷';
  return '🎬';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoCard({
  variant = 'feed',
  id,
  title,
  thumbnailUrl,
  duration,
  creatorName,
  creatorId,
  creatorAvatarUrl,
  viewCount = 0,
  timestamp,
  viewerCount,
  isMembersOnly = false,
  isBoosted = false,
  boostLevel = 0,
  mediaType = 'video',
  isProcessing = false,
  isLocked = false,
  onPress,
  onCreatorPress,
  onMorePress,
}: VideoCardProps): JSX.Element {
  // Derive avatar letter from name or ID
  const avatarLetter = useMemo(() => {
    const source = creatorName || creatorId || '?';
    return source.charAt(0).toUpperCase();
  }, [creatorName, creatorId]);

  // Build meta line
  const metaLine = useMemo(() => {
    const parts: string[] = [];
    
    // Creator name
    if (creatorName) {
      parts.push(creatorName);
    } else if (creatorId) {
      parts.push(creatorId.slice(0, 8));
    }
    
    // Views/viewers
    if (variant === 'live' && viewerCount !== undefined) {
      parts.push(`${formatCount(viewerCount)} watching`);
    } else if (viewCount > 0) {
      parts.push(`${formatCount(viewCount)} views`);
    }
    
    // Timestamp (not for live)
    if (variant !== 'live' && timestamp) {
      parts.push(formatRelativeDate(timestamp));
    }
    
    // Mode indicator for live
    if (variant === 'live') {
      if (mediaType === 'audio_only') parts.push('🎙️ Audio');
      else if (mediaType === 'avatar') parts.push('🎭 Avatar');
    }
    
    return parts.join(' • ');
  }, [variant, creatorName, creatorId, viewCount, viewerCount, timestamp, mediaType]);

  const isDisabled = isProcessing || (isLocked && isMembersOnly);

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isDisabled}
      >
        <View style={styles.thumbWrap}>
          <ThumbnailImage
            source={thumbnailUrl || ''}
            aspectRatio={16 / 9}
            borderRadius={0}
            showLiveBadge={variant === 'live'}
            viewerCount={variant === 'live' ? viewerCount : undefined}
            showDuration={variant !== 'live' && !!duration && !isProcessing}
            durationText={variant !== 'live' ? duration : undefined}
            placeholderIcon={getMediaEmoji(mediaType, variant)}
          />
          
          {/* Viewer count badge (bottom-right) - live (custom overlay) */}
          {variant === 'live' && viewerCount !== undefined && (
            <View style={styles.viewerBadge}>
              <Text style={styles.viewerText}>
                {formatCount(viewerCount)} watching
              </Text>
            </View>
          )}

          {/* Members badge (top-right) */}
          {isMembersOnly && (
            <View style={styles.membersBadge}>
              <Text style={styles.membersBadgeText}>🔒 Members</Text>
            </View>
          )}

          {/* Boosted badge (bottom-left) - feed only */}
          {variant === 'feed' && isBoosted && (
            <View style={styles.boostedBadge}>
              <Text style={styles.boostedBadgeText}>
                🚀 {boostLevel >= 4 ? 'Featured' : 'Boosted'}
              </Text>
            </View>
          )}

          {/* === OVERLAYS === */}

          {/* Processing overlay */}
          {isProcessing && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.overlayText}>Processing...</Text>
            </View>
          )}

          {/* Locked overlay */}
          {isLocked && isMembersOnly && !isProcessing && (
            <View style={styles.overlay}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.overlayText}>Join to watch</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Meta Row */}
      <View style={styles.metaRow}>
        {/* Avatar */}
        <TouchableOpacity
          style={[
            styles.avatar,
            variant === 'live' && styles.avatarLive,
          ]}
          onPress={onCreatorPress}
          activeOpacity={0.85}
        >
          {creatorAvatarUrl ? (
            <Image source={{ uri: creatorAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          )}
        </TouchableOpacity>

        {/* Text Column */}
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {metaLine}
          </Text>
        </View>

        {/* Kebab Menu */}
        <TouchableOpacity
          style={styles.kebab}
          onPress={onMorePress}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={styles.kebabText}>⋮</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4], // 16px
  },

  // Thumbnail
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: darkTheme.semantic.surface,
    position: 'relative',
    borderRadius: 0, // Full width, no border radius on thumbnail
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.semantic.surfaceElevated,
  },
  thumbEmoji: {
    fontSize: 48,
  },

  // LIVE Badge
  liveBadge: {
    position: 'absolute',
    top: spacing[2], // 8px
    left: spacing[2], // 8px
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.red,
    paddingVertical: 4,
    paddingHorizontal: spacing[2], // 8px
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: typography.fontSize.xs, // 10px
    fontWeight: typography.fontWeight.bold as any, // 700
    letterSpacing: 0.5,
  },

  // Duration Badge
  durationBadge: {
    position: 'absolute',
    bottom: spacing[2], // 8px
    right: spacing[2], // 8px
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 3,
    paddingHorizontal: spacing[1] + 2, // 6px
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.semiBold as any, // 600
    fontVariant: ['tabular-nums'],
  },

  // Viewer Badge (Live)
  viewerBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  viewerText: {
    color: '#fff',
    fontSize: 12,
  },

  // Members Badge
  membersBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  membersBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Boosted Badge
  boostedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  boostedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  lockedIcon: {
    fontSize: 36,
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    gap: spacing[2] + 2, // 10px
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[2] + 2, // 10px
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkTheme.youtube.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLive: {
    backgroundColor: darkTheme.youtube.red,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontWeight: typography.fontWeight.bold as any, // 700
    fontSize: typography.fontSize.base, // 14px
  },
  textCol: {
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  title: {
    color: darkTheme.semantic.text,
    fontSize: typography.fontSize.md, // 16px
    fontWeight: typography.fontWeight.medium as any, // 500
    lineHeight: typography.fontSize.md * typography.lineHeight.tight, // ~19px
    marginBottom: spacing[1] / 2, // 2px
  },
  meta: {
    color: darkTheme.semantic.textSecondary,
    fontSize: typography.fontSize.sm, // 12px
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal, // ~18px
  },
  kebab: {
    width: 24,
    alignItems: 'flex-end',
    paddingTop: 2,
    justifyContent: 'flex-start',
  },
  kebabText: {
    color: darkTheme.semantic.textSecondary,
    fontSize: 18,
    lineHeight: 18,
  },
});
