/**
 * UserAvatar Component
 * 
 * Reusable circular avatar component for displaying user profile images.
 * Supports image display, fallback states, and size variants.
 * 
 * Features:
 * - Circular avatar with image support
 * - Fallback with initials or placeholder
 * - Size variants (small, medium, large)
 * - Optional border/ring
 * - YouTube-style dark theme
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface UserAvatarProps {
  /** Image URI */
  uri?: string;
  /** User name (for initials fallback) */
  name?: string;
  /** Custom size in pixels (overrides variant) */
  size?: number;
  /** Size variant */
  variant?: 'small' | 'medium' | 'large';
  /** Show border ring */
  showBorder?: boolean;
  /** Border color */
  borderColor?: string;
  /** Additional style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SIZE_VARIANTS = {
  small: 32,
  medium: 48,
  large: 72,
};

const BORDER_WIDTH = 2;

// =============================================================================
// COMPONENT
// =============================================================================

export function UserAvatar({
  uri,
  name,
  size,
  variant = 'medium',
  showBorder = false,
  borderColor,
  style,
}: UserAvatarProps): JSX.Element {
  const avatarSize = size || SIZE_VARIANTS[variant];
  const radius = avatarSize / 2;
  const finalBorderColor = borderColor || darkTheme.youtube.border;

  // Get initials from name
  const getInitials = (nameStr?: string): string => {
    if (!nameStr) return '?';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr[0].toUpperCase();
  };

  const initials = getInitials(name);

  // Calculate font size based on avatar size
  const fontSize = avatarSize * 0.4;

  // If image URI is provided, show image
  if (uri) {
    return (
      <View
        style={[
          styles.container,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: radius,
          },
          showBorder && {
            borderWidth: BORDER_WIDTH,
            borderColor: finalBorderColor,
          },
          style,
        ]}
      >
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: radius,
            },
          ]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Fallback: Show initials or placeholder
  return (
    <View
      style={[
        styles.container,
        styles.fallback,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: radius,
          backgroundColor: darkTheme.youtube.surfaceElevated,
        },
        showBorder && {
          borderWidth: BORDER_WIDTH,
          borderColor: finalBorderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize,
            color: darkTheme.semantic.text,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: darkTheme.youtube.surfaceElevated,
  },
  initials: {
    fontWeight: typography.fontWeight.semiBold as any,
    textAlign: 'center',
  },
});
