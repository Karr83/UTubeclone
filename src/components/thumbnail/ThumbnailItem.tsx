/**
 * ThumbnailItem Component
 * 
 * Lightweight, reusable thumbnail component for horizontal rows and lists.
 * Optimized for thumbnail-only displays (no text labels).
 * 
 * Features:
 * - Thumbnail image with aspect ratio control
 * - Optional duration badge overlay
 * - Optional play icon overlay
 * - Optional gradient overlay
 * - Pressable with touch feedback
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';
import { ThumbnailImage } from './ThumbnailImage';

// =============================================================================
// TYPES
// =============================================================================

export interface ThumbnailItemProps {
  /** Thumbnail image URL */
  imageUrl: string;
  /** Aspect ratio (default: 16/9) */
  aspectRatio?: number;
  /** Optional duration badge text (e.g., "23:45") */
  duration?: string;
  /** Show play icon overlay */
  showPlayIcon?: boolean;
  /** Show gradient overlay */
  showGradient?: boolean;
  /** Called when thumbnail is pressed */
  onPress?: () => void;
  /** Additional container style */
  style?: ViewStyle;
  /** Width of the thumbnail (default: calculated from aspect ratio) */
  width?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_ASPECT_RATIO = 16 / 9;
const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = DEFAULT_WIDTH / DEFAULT_ASPECT_RATIO;

// =============================================================================
// COMPONENT
// =============================================================================

export function ThumbnailItem({
  imageUrl,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  duration,
  showPlayIcon = false,
  showGradient = false,
  onPress,
  style,
  width = DEFAULT_WIDTH,
}: ThumbnailItemProps): JSX.Element {
  const height = width / aspectRatio;

  const content = (
    <View style={[styles.container, { width, height }, style]}>
      <ThumbnailImage
        source={imageUrl}
        aspectRatio={aspectRatio}
        width={width}
        height={height}
        showDuration={!!duration}
        durationText={duration}
        showPlayIcon={showPlayIcon}
        showGradient={showGradient}
      />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: darkTheme.youtube.surface,
  },
  touchable: {
    // No additional styles needed, content handles sizing
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: darkTheme.youtube.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: darkTheme.youtube.textSecondary,
  },
  
  // Gradient Overlay
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    // Note: For a true gradient, you'd use expo-linear-gradient in production
  },
  
  // Play Icon Overlay
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#000',
    marginLeft: 2, // Optical alignment
  },
  
  // Duration Badge
  durationBadge: {
    position: 'absolute',
    bottom: spacing[1], // 4px
    right: spacing[1], // 4px
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 2,
    paddingHorizontal: spacing[1], // 4px
    borderRadius: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs, // 10px
    fontWeight: typography.fontWeight.semiBold as any,
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
});
