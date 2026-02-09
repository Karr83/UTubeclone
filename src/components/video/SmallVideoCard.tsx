/**
 * SmallVideoCard Component
 * 
 * Compact video card optimized for lists, side sections, and recommendations.
 * Smaller form factor than the main VideoCard component.
 * 
 * Features:
 * - Compact thumbnail (16:9 aspect ratio)
 * - Video title (1-2 lines with ellipsis)
 * - Creator name
 * - View count and time metadata
 * - Optional duration badge on thumbnail
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

export interface SmallVideoCardProps {
  /** Thumbnail image URL */
  thumbnailUrl: string;
  /** Video title */
  title: string;
  /** Creator/channel name */
  creatorName: string;
  /** Video duration (e.g., "23:45") */
  duration?: string;
  /** View count (formatted string, e.g., "329K views") */
  views?: string;
  /** Time metadata (e.g., "1 month ago") */
  timeAgo?: string;
  /** Called when card is pressed */
  onPress: () => void;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const THUMBNAIL_ASPECT_RATIO = 16 / 9;
const THUMBNAIL_WIDTH = 160; // Compact width for small cards
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH / THUMBNAIL_ASPECT_RATIO;

// =============================================================================
// COMPONENT
// =============================================================================

export function SmallVideoCard({
  thumbnailUrl,
  title,
  creatorName,
  duration,
  views,
  timeAgo,
  onPress,
  style,
}: SmallVideoCardProps): JSX.Element {
  // Format metadata line
  const metadata = [views, timeAgo].filter(Boolean).join(' • ');

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <ThumbnailImage
          source={thumbnailUrl}
          aspectRatio={THUMBNAIL_ASPECT_RATIO}
          borderRadius={8}
          showDuration={!!duration}
          durationText={duration}
          width={THUMBNAIL_WIDTH}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Creator Name */}
        <Text style={styles.creatorName} numberOfLines={1}>
          {creatorName}
        </Text>

        {/* Metadata (Views • Time) */}
        {metadata && (
          <Text style={styles.metadata} numberOfLines={1}>
            {metadata}
          </Text>
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
    flexDirection: 'row',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[2],
  },
  
  // Thumbnail
  thumbnailContainer: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: darkTheme.youtube.surface,
    position: 'relative',
    marginRight: spacing[3],
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: darkTheme.youtube.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: darkTheme.youtube.textSecondary,
  },
  
  // Duration Badge
  durationBadge: {
    position: 'absolute',
    bottom: spacing[1],
    right: spacing[1],
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  
  // Content
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: darkTheme.semantic.text,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    marginBottom: spacing[1],
  },
  creatorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.textSecondary,
    marginBottom: spacing[1] / 2,
  },
  metadata: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.textSecondary,
  },
});
