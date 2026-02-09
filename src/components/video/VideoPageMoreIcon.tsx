/**
 * VideoPageMoreIcon Component
 * 
 * Reusable three-dot "More" icon button for video watch pages.
 * Used to trigger the VideoPageIconsDropdown menu.
 * 
 * Features:
 * - Three horizontal dots icon
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

export interface VideoPageMoreIconProps {
  /** Called when icon is pressed */
  onPress: () => void;
  /** Size of the icon container (default: 40) */
  size?: number;
  /** Color of the dots (default: theme text primary) */
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
const DOT_SIZE = 4;
const DOT_SPACING = 4;

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoPageMoreIcon({
  onPress,
  size = DEFAULT_SIZE,
  color = darkTheme.semantic.text,
  style,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: VideoPageMoreIconProps): JSX.Element {
  const containerSize = size;
  const dotColor = color;
  
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
      <View style={styles.dotsContainer}>
        {/* Dot 1 */}
        <View
          style={[
            styles.dot,
            {
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: dotColor,
            },
          ]}
        />
        {/* Dot 2 */}
        <View
          style={[
            styles.dot,
            styles.dotMiddle,
            {
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: dotColor,
            },
          ]}
        />
        {/* Dot 3 */}
        <View
          style={[
            styles.dot,
            {
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: dotColor,
            },
          ]}
        />
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
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: DOT_SIZE / 2,
  },
  dotMiddle: {
    marginHorizontal: DOT_SPACING,
  },
  disabled: {
    opacity: 0.5,
  },
});
