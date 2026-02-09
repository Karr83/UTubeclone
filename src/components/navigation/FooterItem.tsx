/**
 * FooterItem Component
 * 
 * Reusable bottom navigation item for tab bars and footers.
 * Supports active and inactive states with visual indicators.
 * 
 * Features:
 * - Icon (with optional active variant)
 * - Label text below icon
 * - Active state indicator (color change)
 * - Proper touch feedback
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

export interface FooterItemProps {
  /** Tab label text */
  label: string;
  /** Icon component (ReactNode) */
  icon: React.ReactNode;
  /** Optional active icon variant */
  activeIcon?: React.ReactNode;
  /** Whether this item is currently active */
  isActive: boolean;
  /** Called when item is pressed */
  onPress: () => void;
  /** Additional container style */
  style?: ViewStyle;
  /** Badge count (optional) */
  badge?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ICON_SIZE = 24;
const ACTIVE_COLOR = darkTheme.youtube.red; // YouTube red for active state
const INACTIVE_COLOR = darkTheme.semantic.textSecondary; // Gray for inactive

// =============================================================================
// COMPONENT
// =============================================================================

export function FooterItem({
  label,
  icon,
  activeIcon,
  isActive,
  onPress,
  style,
  badge,
}: FooterItemProps): JSX.Element {
  const displayIcon = isActive && activeIcon ? activeIcon : icon;
  const iconColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
  const labelColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          {/* Render icon with color if it's a text/emoji icon */}
          {typeof displayIcon === 'string' ? (
            <Text style={[styles.iconText, { color: iconColor }]}>
              {displayIcon}
            </Text>
          ) : (
            <View style={styles.iconWrapper}>
              {displayIcon}
            </View>
          )}
          
          {/* Badge */}
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: labelColor },
            isActive && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {/* Active Indicator (optional underline) */}
        {isActive && <View style={styles.activeIndicator} />}
      </View>
    </TouchableOpacity>
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
    paddingVertical: spacing[2], // 8px
    minHeight: 60,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1], // 4px
    position: 'relative',
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: darkTheme.youtube.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: spacing[1] / 2, // 2px
  },
  labelActive: {
    fontWeight: typography.fontWeight.medium as any, // 500
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -spacing[2], // -8px (below label)
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 2,
    backgroundColor: ACTIVE_COLOR,
    borderRadius: 1,
  },
});
