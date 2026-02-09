/**
 * PlaylistCard Component
 * 
 * Reusable playlist card for displaying playlists in lists and feeds.
 * Visually differentiated from single video cards.
 * 
 * Features:
 * - Playlist thumbnail with play icon overlay
 * - Video count badge (e.g., "12 videos")
 * - Playlist title (max 2 lines)
 * - Creator name
 * - "PLAY ALL" button overlay
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';
import { ThumbnailImage } from '../thumbnail';

// =============================================================================
// TYPES
// =============================================================================

export interface PlaylistCardProps {
  /** Playlist thumbnail URL */
  thumbnailUrl: string;
  /** Playlist title */
  title: string;
  /** Creator/channel name */
  creatorName?: string;
  /** Number of videos in playlist */
  videoCount: number;
  /** Called when card is pressed */
  onPress: () => void;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PlaylistCard({
  thumbnailUrl,
  title,
  creatorName,
  videoCount,
  onPress,
  style,
}: PlaylistCardProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Thumbnail with overlay */}
      <View style={styles.thumbnailContainer}>
        <ThumbnailImage
          source={thumbnailUrl}
          aspectRatio={16 / 9}
          borderRadius={0}
          showGradient={true}
          showPlayIcon={true}
          placeholderIcon="📑"
        />
        
        {/* Video count badge (top-right) - custom overlay */}
        <View style={styles.countBadge}>
          <Text style={styles.countIcon}>▶</Text>
          <Text style={styles.countText}>{videoCount}</Text>
        </View>
        
        {/* Play All text (below play icon) */}
        <View style={styles.playAllTextContainer}>
          <Text style={styles.playAllText}>PLAY ALL</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Creator Name */}
        {creatorName && (
          <Text style={styles.creatorName} numberOfLines={1}>
            {creatorName}
          </Text>
        )}

        {/* Video count text */}
        <Text style={styles.videoCountText}>
          {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4], // 16px
    width: '100%',
  },
  
  // Thumbnail
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: darkTheme.youtube.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: darkTheme.youtube.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  
  // Dark overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  
  // Video count badge (top-right)
  countBadge: {
    position: 'absolute',
    top: spacing[2], // 8px
    right: spacing[2], // 8px
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingVertical: spacing[1], // 4px
    paddingHorizontal: spacing[2], // 8px
    borderRadius: 4,
    gap: spacing[1], // 4px
  },
  countIcon: {
    fontSize: typography.fontSize.xs, // 10px
    color: '#FFF',
  },
  countText: {
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.semiBold as any,
    color: '#FFF',
  },
  
  // Play All text container (positioned below play icon from ThumbnailImage)
  playAllTextContainer: {
    position: 'absolute',
    bottom: spacing[4] + spacing[2], // Position below play icon (56px + 8px)
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAllText: {
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.bold as any,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  
  // Content
  content: {
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[2] + 2, // 10px
  },
  title: {
    fontSize: typography.fontSize.md, // 16px
    fontWeight: typography.fontWeight.medium as any,
    color: darkTheme.semantic.text,
    lineHeight: typography.fontSize.md * typography.lineHeight.tight,
    marginBottom: spacing[1], // 4px
  },
  creatorName: {
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.textSecondary,
    marginBottom: spacing[1] / 2, // 2px
  },
  videoCountText: {
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.textSecondary,
  },
});
