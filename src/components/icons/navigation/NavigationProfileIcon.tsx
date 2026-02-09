/**
 * NavigationProfileIcon Component
 * 
 * Icon-only profile icon for navigation bars.
 * Supports active/inactive states and optional avatar display.
 * 
 * Features:
 * - Profile icon (active/inactive states)
 * - Optional avatar image
 * - Icon-only (no labels)
 * - Compatible with React Navigation tabBarIcon
 * - YouTube-style dark theme
 */

import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { darkTheme } from '../../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface NavigationProfileIconProps {
  /** Whether the icon is in focused/active state */
  focused?: boolean;
  /** Icon/avatar size (default: 24) */
  size?: number;
  /** Icon color (only used when no avatar) */
  color?: string;
  /** Avatar image URL (if provided, shows avatar instead of icon) */
  avatarUrl?: string;
  /** Additional style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 24;
const STROKE_WIDTH = 2;
const ACTIVE_COLOR = darkTheme.semantic.text; // White
const INACTIVE_COLOR = darkTheme.semantic.textSecondary; // Gray

// =============================================================================
// COMPONENT
// =============================================================================

export function NavigationProfileIcon({
  focused = false,
  size = DEFAULT_SIZE,
  color,
  avatarUrl,
  style,
}: NavigationProfileIconProps): JSX.Element {
  const iconColor = color || (focused ? ACTIVE_COLOR : INACTIVE_COLOR);
  const radius = size / 2;

  // If avatar URL is provided, show avatar
  if (avatarUrl) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View
          style={[
            styles.avatarContainer,
            {
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: focused ? STROKE_WIDTH : 0,
              borderColor: ACTIVE_COLOR,
            },
          ]}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatar,
              {
                width: size,
                height: size,
                borderRadius: radius,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

  // Show profile icon (filled when active, outline when inactive)
  if (focused) {
    // Filled version (active)
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: iconColor,
            },
          ]}
        >
          {/* Head (filled) */}
          <View
            style={[
              styles.profileHead,
              {
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: size * 0.2,
                backgroundColor: darkTheme.semantic.background,
                position: 'absolute',
                top: size * 0.2,
                left: size * 0.3,
              },
            ]}
          />
          {/* Body (filled) */}
          <View
            style={[
              styles.profileBody,
              {
                width: size * 0.5,
                height: size * 0.3,
                borderRadius: size * 0.25,
                backgroundColor: darkTheme.semantic.background,
                position: 'absolute',
                bottom: size * 0.1,
                left: size * 0.25,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  // Outline version (inactive)
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: STROKE_WIDTH,
            borderColor: iconColor,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Head (outline) */}
        <View
          style={[
            styles.profileHead,
            {
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              borderWidth: STROKE_WIDTH,
              borderColor: iconColor,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: size * 0.2,
              left: size * 0.3,
            },
          ]}
        />
        {/* Body (outline) */}
        <View
          style={[
            styles.profileBody,
            {
              width: size * 0.5,
              height: size * 0.3,
              borderRadius: size * 0.25,
              borderWidth: STROKE_WIDTH,
              borderColor: iconColor,
              backgroundColor: 'transparent',
              position: 'absolute',
              bottom: size * 0.1,
              left: size * 0.25,
            },
          ]}
        />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHead: {
    position: 'absolute',
  },
  profileBody: {
    position: 'absolute',
  },
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: darkTheme.youtube.surface,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
