/**
 * ThumbnailImage Component
 * 
 * Base thumbnail image component used across all video and playlist cards.
 * Provides consistent sizing, border radius, and overlay support.
 * 
 * Features:
 * - Image with fixed aspect ratio
 * - Border radius control
 * - Optional overlays (duration badge, live badge, gradient, play icon)
 * - Placeholder fallback
 * - Custom overlay support
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface ThumbnailImageProps {
  /** Image source URL */
  source: string;
  /** Aspect ratio (default: 16/9) */
  aspectRatio?: number;
  /** Border radius (default: 0) */
  borderRadius?: number;
  /** Show duration badge */
  showDuration?: boolean;
  /** Duration text (e.g., "23:45") */
  durationText?: string;
  /** Show live badge */
  showLiveBadge?: boolean;
  /** Live viewer count (for live badge) */
  viewerCount?: number;
  /** Show gradient overlay */
  showGradient?: boolean;
  /** Show play icon overlay (center) */
  showPlayIcon?: boolean;
  /** Custom overlay component */
  overlay?: React.ReactNode;
  /** Placeholder icon/emoji */
  placeholderIcon?: string;
  /** Additional container style */
  style?: ViewStyle;
  /** Width override (if not provided, uses 100% of container) */
  width?: number;
  /** Height override (if not provided, calculated from aspect ratio) */
  height?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_ASPECT_RATIO = 16 / 9;
const DEFAULT_PLACEHOLDER_ICON = '▶';

// =============================================================================
// COMPONENT
// =============================================================================

export function ThumbnailImage({
  source,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  borderRadius = 0,
  showDuration = false,
  durationText,
  showLiveBadge = false,
  viewerCount,
  showGradient = false,
  showPlayIcon = false,
  overlay,
  placeholderIcon = DEFAULT_PLACEHOLDER_ICON,
  style,
  width,
  height,
}: ThumbnailImageProps): JSX.Element {
  // Calculate dimensions
  const calculatedHeight = width ? width / aspectRatio : undefined;
  const finalHeight = height || calculatedHeight;

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        width && { width },
        finalHeight && { height: finalHeight },
        style,
      ]}
    >
      {/* Image */}
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { borderRadius },
            width && { width },
            finalHeight && { height: finalHeight },
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { borderRadius },
            width && { width },
            finalHeight && { height: finalHeight },
          ]}
        >
          <Text style={styles.placeholderIcon}>{placeholderIcon}</Text>
        </View>
      )}

      {/* Gradient Overlay */}
      {showGradient && (
        <View style={[styles.gradientOverlay, { borderRadius }]} />
      )}

      {/* Live Badge (top-left) */}
      {showLiveBadge && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
          {viewerCount !== undefined && (
            <Text style={styles.viewerText}>
              {' '}
              {viewerCount > 999
                ? `${(viewerCount / 1000).toFixed(1)}K`
                : viewerCount}{' '}
              watching
            </Text>
          )}
        </View>
      )}

      {/* Duration Badge (bottom-right) */}
      {showDuration && durationText && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{durationText}</Text>
        </View>
      )}

      {/* Play Icon Overlay (center) */}
      {showPlayIcon && (
        <View style={styles.playIconContainer}>
          <View style={styles.playIconCircle}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      )}

      {/* Custom Overlay */}
      {overlay && <View style={styles.customOverlay}>{overlay}</View>}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: darkTheme.youtube.surface,
    width: '100%',
  },
  image: {
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
    fontSize: 48,
    color: darkTheme.youtube.textSecondary,
  },
  
  // Gradient Overlay
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  
  // Live Badge
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
    backgroundColor: '#FFF',
  },
  liveText: {
    fontSize: typography.fontSize.xs, // 10px
    fontWeight: typography.fontWeight.bold as any,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  viewerText: {
    fontSize: typography.fontSize.xs, // 10px
    color: '#FFF',
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
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.semiBold as any,
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  
  // Play Icon Overlay
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: '#000',
    marginLeft: 2, // Optical alignment
  },
  
  // Custom Overlay
  customOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
