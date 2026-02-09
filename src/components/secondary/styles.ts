/**
 * Secondary Column Shared Styles
 * 
 * Common style tokens for secondary column components.
 * References darkTheme for consistency.
 */

import { StyleSheet } from 'react-native';
import { darkTheme } from '../../theme';

// =============================================================================
// SHARED CONSTANTS
// =============================================================================

export const THUMBNAIL_WIDTH = 160;
export const THUMBNAIL_HEIGHT = 90; // 16:9 ratio
export const THUMBNAIL_BORDER_RADIUS = 8;
export const DURATION_BADGE_PADDING_H = 4;
export const DURATION_BADGE_PADDING_V = 2;

export const CHIP_HEIGHT = 32;
export const CHIP_PADDING_H = 12;
export const CHIP_BORDER_RADIUS = 8;

// =============================================================================
// COLORS (from theme)
// =============================================================================

export const colors = {
  // Backgrounds
  background: darkTheme.semantic.background,
  surface: darkTheme.semantic.surface,
  chipBackground: darkTheme.youtube.chipBackground,
  chipActive: darkTheme.youtube.chipActive,
  
  // Text
  text: darkTheme.semantic.text,
  textSecondary: darkTheme.semantic.textSecondary,
  textTertiary: darkTheme.semantic.textTertiary,
  chipActiveText: darkTheme.youtube.chipActiveText,
  
  // Other
  border: darkTheme.semantic.border,
  divider: darkTheme.semantic.divider,
  durationBadge: 'rgba(0,0,0,0.8)',
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  meta: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  duration: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};

// =============================================================================
// SHARED STYLES
// =============================================================================

export const sharedStyles = StyleSheet.create({
  // Thumbnail styles
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: THUMBNAIL_BORDER_RADIUS,
    backgroundColor: colors.surface,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: THUMBNAIL_BORDER_RADIUS,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.durationBadge,
    paddingHorizontal: DURATION_BADGE_PADDING_H,
    paddingVertical: DURATION_BADGE_PADDING_V,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: typography.duration.fontSize,
    fontWeight: typography.duration.fontWeight,
  },
  
  // Chip styles
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: CHIP_PADDING_H,
    borderRadius: CHIP_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.chipBackground,
  },
  chipActive: {
    backgroundColor: colors.chipActive,
  },
  chipText: {
    fontSize: typography.chipText.fontSize,
    fontWeight: typography.chipText.fontWeight,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.chipActiveText,
  },
});
