/**
 * VideoPageLikeIcon Component
 * 
 * Reusable "Like" (thumbs up) icon button for video watch pages.
 * Supports liked and not liked states with visual feedback.
 * 
 * Features:
 * - Thumbs up icon with outline/filled states
 * - Liked state (filled/highlighted) vs not liked state (outline)
 * - Press feedback (opacity)
 * - Proper hit area for touch
 * - Themed colors (dark YouTube style)
 * - Accessible and customizable
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface VideoPageLikeIconProps {
  /** Whether the item is liked */
  liked: boolean;
  /** Called when icon is pressed */
  onPress: () => void;
  /** Size of the icon container (default: 40) */
  size?: number;
  /** Color when liked/active (default: theme text primary) */
  activeColor?: string;
  /** Color when not liked/inactive (default: theme text primary) */
  inactiveColor?: string;
  /** Additional style for the container */
  style?: ViewStyle;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom hit slop area (default: { top: 8, bottom: 8, left: 8, right: 8 }) */
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 40;
const ICON_WIDTH = 22;
const ICON_HEIGHT = 22;
const STROKE_WIDTH = 1.5;

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoPageLikeIcon({
  liked,
  onPress,
  size = DEFAULT_SIZE,
  activeColor = darkTheme.semantic.text,
  inactiveColor = darkTheme.semantic.text,
  style,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: VideoPageLikeIconProps): JSX.Element {
  const containerSize = size;
  const iconColor = liked ? activeColor : inactiveColor;
  const isFilled = liked;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={hitSlop}
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        {/* Thumbs up icon: hand with thumb pointing up */}
        <View style={styles.thumbsUp}>
          {/* Palm/base of hand (rounded rectangle) */}
          <View
            style={[
              styles.palm,
              {
                backgroundColor: isFilled ? iconColor : 'transparent',
                borderColor: iconColor,
                borderWidth: STROKE_WIDTH,
              },
            ]}
          />
          
          {/* Thumb pointing up (rounded rectangle positioned above palm) */}
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: isFilled ? iconColor : 'transparent',
                borderColor: iconColor,
                borderWidth: STROKE_WIDTH,
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    // Transparent background to allow parent styling
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
  },
  thumbsUp: {
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  palm: {
    width: 11,
    height: 13,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 2,
    left: ICON_WIDTH / 2 - 5.5,
    // Rounded bottom (wrist), slightly rounded top (fingers)
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  thumb: {
    width: 5,
    height: 9,
    borderRadius: 1.5,
    position: 'absolute',
    top: 1,
    left: ICON_WIDTH / 2 + 2,
    // Thumb curves upward and outward
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 2,
    // Rotate to point upward
    transform: [{ rotate: '-25deg' }],
  },
  disabled: {
    opacity: 0.5,
  },
});
