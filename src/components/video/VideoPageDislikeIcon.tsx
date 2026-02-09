/**
 * VideoPageDislikeIcon Component
 * 
 * Reusable "Dislike" (thumbs down) icon button for video watch pages.
 * Supports disliked and not disliked states with visual feedback.
 * 
 * Features:
 * - Thumbs down icon with outline/filled states
 * - Disliked state (filled/highlighted) vs not disliked state (outline)
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

export interface VideoPageDislikeIconProps {
  /** Whether the item is disliked */
  disliked: boolean;
  /** Called when icon is pressed */
  onPress: () => void;
  /** Size of the icon container (default: 40) */
  size?: number;
  /** Color when disliked/active (default: theme text primary) */
  activeColor?: string;
  /** Color when not disliked/inactive (default: theme text primary) */
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

export function VideoPageDislikeIcon({
  disliked,
  onPress,
  size = DEFAULT_SIZE,
  activeColor = darkTheme.semantic.text,
  inactiveColor = darkTheme.semantic.text,
  style,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: VideoPageDislikeIconProps): JSX.Element {
  const containerSize = size;
  const iconColor = disliked ? activeColor : inactiveColor;
  const isFilled = disliked;
  
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
        {/* Thumbs down icon: hand with thumb pointing down */}
        <View style={styles.thumbsDown}>
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
          
          {/* Thumb pointing down (rounded rectangle rotated/positioned) */}
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
  thumbsDown: {
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
    top: 2,
    left: ICON_WIDTH / 2 - 5.5,
    // Rounded top (fingers), slightly rounded bottom (wrist)
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  thumb: {
    width: 5,
    height: 9,
    borderRadius: 1.5,
    position: 'absolute',
    bottom: 1,
    right: ICON_WIDTH / 2 - 1,
    // Thumb curves downward and outward
    borderTopLeftRadius: 1,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    // Rotate to point downward
    transform: [{ rotate: '25deg' }],
  },
  disabled: {
    opacity: 0.5,
  },
});
