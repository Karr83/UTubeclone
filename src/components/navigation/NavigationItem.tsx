/**
 * NavigationItem Component
 * 
 * Individual navigation item for bottom tabs and top navigation.
 * Supports icon-only or icon + label display with active/inactive states.
 * 
 * Features:
 * - Icon display (ReactNode)
 * - Optional label text
 * - Active/inactive states
 * - Proper touch target sizing
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface NavigationItemProps {
  /** Icon component (ReactNode) */
  icon: React.ReactNode;
  /** Optional label text */
  label?: string;
  /** Whether the item is focused/active */
  focused?: boolean;
  /** Badge count (optional) */
  badge?: number;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_TOUCH_TARGET = 48; // Mobile accessibility guideline
const ACTIVE_COLOR = darkTheme.semantic.text; // White
const INACTIVE_COLOR = darkTheme.semantic.textSecondary; // Gray

// =============================================================================
// COMPONENT
// =============================================================================

export function NavigationItem({
  icon,
  label,
  focused = false,
  badge,
  style,
}: NavigationItemProps): JSX.Element {
  const labelColor = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  const hasBadge = badge !== undefined && badge > 0;

  return (
    <View
      style={[
        styles.container,
        { minHeight: MIN_TOUCH_TARGET },
        style,
      ]}
    >
      {/* Icon Container */}
      <View style={styles.iconContainer}>
        {icon}
        
        {/* Badge */}
        {hasBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>

      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            { color: labelColor },
            focused && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1], // 4px
    minWidth: MIN_TOUCH_TARGET,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[0] + 1, // 1px
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    backgroundColor: darkTheme.youtube.red,
    borderRadius: 9,
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
  label: {
    fontSize: typography.fontSize.xs, // 10px
    fontWeight: typography.fontWeight.normal as any,
    textAlign: 'center',
    marginTop: spacing[0] + 1, // 1px
  },
  labelActive: {
    fontWeight: typography.fontWeight.medium as any, // 500
  },
});
