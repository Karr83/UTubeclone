/**
 * TopMenuIcon Component
 * 
 * Reusable icon button for top app bar / header navigation.
 * Optimized for icon-only usage with proper touch targets.
 * 
 * Features:
 * - Icon-only button (ReactNode or string/emoji)
 * - Optional badge/dot indicator
 * - Active/pressed state styling
 * - Proper touch target sizing (44x44px minimum)
 * - Disabled state support
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface TopMenuIconProps {
  /** Icon component (ReactNode) or string/emoji */
  icon: React.ReactNode | string;
  /** Called when icon is pressed */
  onPress: () => void;
  /** Icon size (default: 24) */
  size?: number;
  /** Icon color (default: theme text primary) */
  color?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Badge count (shows as number or dot if > 0) */
  badge?: number;
  /** Show dot indicator (instead of badge number) */
  showDot?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 24;
const MIN_TOUCH_TARGET = 44; // Mobile accessibility guideline
const BADGE_SIZE = 18;
const DOT_SIZE = 8;

// =============================================================================
// COMPONENT
// =============================================================================

export function TopMenuIcon({
  icon,
  onPress,
  size = DEFAULT_SIZE,
  color = darkTheme.semantic.text,
  disabled = false,
  badge,
  showDot = false,
  style,
}: TopMenuIconProps): JSX.Element {
  const hasBadge = badge !== undefined && badge > 0;
  const hasDot = showDot && !hasBadge;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET },
        disabled && styles.disabled,
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={styles.iconContainer}>
        {/* Icon */}
        {typeof icon === 'string' ? (
          <Text style={[styles.iconText, { fontSize: size, color }]}>
            {icon}
          </Text>
        ) : (
          <View style={[styles.iconWrapper, { width: size, height: size }]}>
            {icon}
          </View>
        )}

        {/* Badge (number) */}
        {hasBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}

        {/* Dot indicator */}
        {hasDot && <View style={styles.dot} />}
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
    padding: spacing[2], // 8px
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    lineHeight: DEFAULT_SIZE,
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Badge
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    backgroundColor: darkTheme.youtube.red,
    borderRadius: BADGE_SIZE / 2,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: darkTheme.semantic.background,
  },
  badgeText: {
    color: '#FFF',
    fontSize: typography.fontSize.xs, // 10px
    fontWeight: typography.fontWeight.bold as any,
    lineHeight: 12,
  },
  
  // Dot indicator
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: darkTheme.youtube.red,
    borderWidth: 2,
    borderColor: darkTheme.semantic.background,
  },
});
