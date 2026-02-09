/**
 * SecondaryVideoItem Component
 * 
 * Compact video card for the "Up Next" / related videos list.
 * Horizontal layout: thumbnail (left) + info (right).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  colors,
  typography,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_BORDER_RADIUS,
} from './styles';

// =============================================================================
// TYPES
// =============================================================================

interface SecondaryVideoItemProps {
  /** Video thumbnail URL */
  thumbnailUrl?: string;
  /** Video title */
  title: string;
  /** Creator/channel name */
  creatorName: string;
  /** View count (formatted string or number) */
  viewCount: number | string;
  /** Time since published (e.g., "3 years ago") */
  timeAgo: string;
  /** Video duration formatted (e.g., "23:45") */
  duration: string;
  /** Callback when video item is pressed */
  onPress?: () => void;
  /** Callback when more options (three dots) pressed */
  onMorePress?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatViews = (views: number | string): string => {
  if (typeof views === 'string') return views;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(0)}M views`;
  if (views >= 1_000) return `${Math.floor(views / 1_000)}K views`;
  return `${views} views`;
};

// =============================================================================
// COMPONENT
// =============================================================================

export function SecondaryVideoItem({
  thumbnailUrl,
  title,
  creatorName,
  viewCount,
  timeAgo,
  duration,
  onPress,
  onMorePress,
}: SecondaryVideoItemProps): JSX.Element {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.placeholderIcon}>🎬</Text>
          </View>
        )}
        
        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.creatorName} numberOfLines={1}>
          {creatorName}
        </Text>
        <Text style={styles.meta}>
          {formatViews(viewCount)} · {timeAgo}
        </Text>
      </View>

      {/* More Options */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={onMorePress}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Text style={styles.moreIcon}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  thumbnailContainer: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: THUMBNAIL_BORDER_RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: typography.duration.fontSize,
    fontWeight: typography.duration.fontWeight,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: typography.videoTitle.fontSize,
    fontWeight: typography.videoTitle.fontWeight,
    lineHeight: typography.videoTitle.lineHeight,
    color: colors.text,
    marginBottom: 4,
  },
  creatorName: {
    fontSize: typography.creatorName.fontSize,
    fontWeight: typography.creatorName.fontWeight,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  meta: {
    fontSize: typography.meta.fontSize,
    fontWeight: typography.meta.fontWeight,
    color: colors.textSecondary,
  },
  moreButton: {
    paddingLeft: 8,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  moreIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
