/**
 * TopMenuItem Component
 * 
 * Reusable menu item for overflow menus, action sheets, and top menus.
 * Used in vertical menu lists for actions and navigation.
 * 
 * Features:
 * - Leading icon support
 * - Label text
 * - Optional subtitle
 * - Destructive state (red text/icon)
 * - Disabled state
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

export interface TopMenuItemProps {
  /** Menu item label */
  label: string;
  /** Optional leading icon (ReactNode or string/emoji) */
  icon?: React.ReactNode | string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Called when item is pressed */
  onPress: () => void;
  /** Destructive action (shows in red) */
  destructive?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Show divider after this item */
  showDivider?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ICON_SIZE = 20;
const MIN_TOUCH_HEIGHT = 48; // Mobile accessibility guideline

// =============================================================================
// COMPONENT
// =============================================================================

export function TopMenuItem({
  label,
  icon,
  subtitle,
  onPress,
  destructive = false,
  disabled = false,
  showDivider = false,
  style,
}: TopMenuItemProps): JSX.Element {
  const textColor = destructive
    ? darkTheme.youtube.red
    : darkTheme.semantic.text;
  const iconColor = destructive
    ? darkTheme.youtube.red
    : darkTheme.semantic.textSecondary;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.container,
          disabled && styles.disabled,
          style,
        ]}
      >
        {/* Leading Icon */}
        {icon && (
          <View style={styles.iconContainer}>
            {typeof icon === 'string' ? (
              <Text style={[styles.iconText, { color: iconColor }]}>
                {icon}
              </Text>
            ) : (
              <View style={styles.iconWrapper}>{icon}</View>
            )}
          </View>
        )}

        {/* Text Content */}
        <View style={[styles.textContainer, !icon && styles.textContainerNoIcon]}>
          <Text
            style={[
              styles.label,
              { color: textColor },
              disabled && styles.labelDisabled,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                disabled && styles.subtitleDisabled,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Divider */}
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_HEIGHT,
    paddingHorizontal: spacing[4], // 16px
    paddingVertical: spacing[3], // 12px
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: ICON_SIZE + spacing[2], // 28px total (icon + spacing)
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: spacing[3], // 12px
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  textContainerNoIcon: {
    marginLeft: 0,
  },
  label: {
    fontSize: typography.fontSize.base, // 14px
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.text,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal, // ~21px
  },
  labelDisabled: {
    opacity: 0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.sm, // 12px
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.textSecondary,
    marginTop: spacing[0] + 1, // 1px
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal, // ~18px
  },
  subtitleDisabled: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.youtube.border,
    marginLeft: spacing[4], // 16px
    marginRight: spacing[4], // 16px
  },
});
