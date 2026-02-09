/**
 * VideoPageShareIcon Component
 * 
 * Reusable "Share" icon button for video watch pages.
 * Classic share icon: right-pointing arrow with curved tail.
 * 
 * Features:
 * - Right-pointing arrow with curved tail
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

export interface VideoPageShareIconProps {
  /** Called when icon is pressed */
  onPress: () => void;
  /** Size of the icon container (default: 40) */
  size?: number;
  /** Color of the icon (default: theme text primary) */
  color?: string;
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
const ICON_WIDTH = 20;
const ICON_HEIGHT = 20;
const STROKE_WIDTH = 1.5;

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoPageShareIcon({
  onPress,
  size = DEFAULT_SIZE,
  color = darkTheme.semantic.text,
  style,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: VideoPageShareIconProps): JSX.Element {
  const containerSize = size;
  const iconColor = color;
  
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
        {/* Share icon: curved tail + arrowhead */}
        <View style={styles.shareIcon}>
          {/* Curved tail (left side) - semi-circle */}
          <View
            style={[
              styles.tail,
              {
                borderColor: iconColor,
                borderWidth: STROKE_WIDTH,
              },
            ]}
          />
          
          {/* Arrow shaft (horizontal line connecting tail to arrowhead) */}
          <View
            style={[
              styles.shaft,
              {
                backgroundColor: iconColor,
              },
            ]}
          />
          
          {/* Arrowhead (right side) - triangle pointing right */}
          <View
            style={[
              styles.arrowhead,
              {
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderRightColor: 'transparent',
                borderLeftColor: iconColor,
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
  shareIcon: {
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    position: 'relative',
  },
  tail: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: STROKE_WIDTH,
    position: 'absolute',
    left: 0,
    top: ICON_HEIGHT / 2 - 4.5,
    // Create curved appearance by only showing part of the circle
    borderRightWidth: 0,
    borderTopWidth: STROKE_WIDTH,
    borderBottomWidth: STROKE_WIDTH,
    borderLeftWidth: STROKE_WIDTH,
  },
  shaft: {
    width: 7,
    height: STROKE_WIDTH,
    position: 'absolute',
    left: 7,
    top: ICON_HEIGHT / 2 - STROKE_WIDTH / 2,
  },
  arrowhead: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderStyle: 'solid',
    position: 'absolute',
    right: 0,
    top: ICON_HEIGHT / 2 - 3.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
