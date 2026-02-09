/**
 * NavigationProfile Component
 * 
 * Profile navigation item for bottom tabs and top navigation bars.
 * Supports icon and avatar display with active/inactive states.
 * 
 * Features:
 * - Profile icon (active/inactive states)
 * - Avatar image support
 * - Compatible with React Navigation tabBarIcon
 * - Consistent sizing and alignment
 * - YouTube-style dark theme
 */

import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { darkTheme } from '../../theme';
import { NavigationIcon } from '../icons/navigation';

// =============================================================================
// TYPES
// =============================================================================

export interface NavigationProfileProps {
  /** Whether the profile is in focused/active state */
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
const ACTIVE_COLOR = darkTheme.semantic.text; // White
const INACTIVE_COLOR = darkTheme.semantic.textSecondary; // Gray

// =============================================================================
// COMPONENT
// =============================================================================

export function NavigationProfile({
  focused = false,
  size = DEFAULT_SIZE,
  color,
  avatarUrl,
  style,
}: NavigationProfileProps): JSX.Element {
  const iconColor = color || (focused ? ACTIVE_COLOR : INACTIVE_COLOR);

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
              borderRadius: size / 2,
              borderWidth: focused ? 2 : 0,
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
                borderRadius: size / 2,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

  // Otherwise, show profile icon
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <NavigationIcon
        name="profile"
        focused={focused}
        size={size}
        color={iconColor}
      />
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
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: darkTheme.youtube.surface,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
