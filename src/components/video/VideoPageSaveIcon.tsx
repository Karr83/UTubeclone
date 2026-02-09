/**
 * VideoPageSaveIcon Component
 * 
 * Reusable "Save / Bookmark" icon button for video watch pages.
 * Supports saved and unsaved states with visual feedback.
 * 
 * Features:
 * - Bookmark icon with outline/filled states
 * - Saved state (filled) vs unsaved state (outline)
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

export interface VideoPageSaveIconProps {
  /** Whether the item is saved */
  saved: boolean;
  /** Called when icon is pressed */
  onPress: () => void;
  /** Size of the icon container (default: 40) */
  size?: number;
  /** Color when saved/active (default: theme text primary) */
  activeColor?: string;
  /** Color when not saved/inactive (default: theme text primary) */
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
const BOOKMARK_WIDTH = 14;
const BOOKMARK_HEIGHT = 18;

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoPageSaveIcon({
  saved,
  onPress,
  size = DEFAULT_SIZE,
  activeColor = darkTheme.semantic.text,
  inactiveColor = darkTheme.semantic.text,
  style,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: VideoPageSaveIconProps): JSX.Element {
  const containerSize = size;
  const iconColor = saved ? activeColor : inactiveColor;
  const isFilled = saved;
  
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
        {/* Bookmark icon shape - rectangle with V-notch at bottom */}
        <View
          style={[
            styles.bookmarkContainer,
          ]}
        >
          {/* Main rectangle body */}
          <View
            style={[
              styles.bookmarkBody,
              {
                backgroundColor: isFilled ? iconColor : 'transparent',
                borderColor: iconColor,
              },
            ]}
          />
          {/* V-notch triangle at bottom */}
          <View
            style={[
              styles.bookmarkNotch,
              {
                borderTopColor: isFilled ? iconColor : iconColor,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
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
  },
  bookmarkContainer: {
    alignItems: 'center',
  },
  bookmarkBody: {
    width: BOOKMARK_WIDTH,
    height: BOOKMARK_HEIGHT - 4, // Leave room for notch
    borderWidth: 1.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomWidth: 0,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
  },
  bookmarkNotch: {
    width: 0,
    height: 0,
    borderLeftWidth: BOOKMARK_WIDTH / 2 + 1,
    borderRightWidth: BOOKMARK_WIDTH / 2 + 1,
    borderTopWidth: 4,
    borderStyle: 'solid',
    marginTop: -1.5, // Overlap slightly with body for seamless connection
  },
  disabled: {
    opacity: 0.5,
  },
});
