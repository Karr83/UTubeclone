/**
 * SidebarMenuTitle Component
 * 
 * Non-interactive section title for sidebars, drawers, and menu sections.
 * Used to visually separate groups of menu items.
 * 
 * Features:
 * - Uppercase section title text
 * - Proper vertical spacing
 * - Optional divider above
 * - YouTube-style dark theme
 * - Accessibility support (header role)
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

export interface SidebarMenuTitleProps {
  /** Section title text (will be uppercased) */
  title: string;
  /** Show divider above the title */
  showDivider?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TITLE_FONT_SIZE = typography.fontSize.sm; // 12px
const LETTER_SPACING = 0.5; // Small letter spacing for uppercase

// =============================================================================
// COMPONENT
// =============================================================================

export function SidebarMenuTitle({
  title,
  showDivider = false,
  style,
}: SidebarMenuTitleProps): JSX.Element {
  return (
    <View style={[styles.container, style]}>
      {/* Divider (above) */}
      {showDivider && <View style={styles.divider} />}
      
      {/* Title */}
      <Text
        style={styles.title}
        accessibilityRole="header"
        accessibilityLevel={3}
      >
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4], // 16px
    paddingTop: spacing[4], // 16px
    paddingBottom: spacing[2], // 8px
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.youtube.border,
    marginBottom: spacing[3], // 12px
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: typography.fontWeight.medium as any, // 500
    color: darkTheme.semantic.textSecondary,
    letterSpacing: LETTER_SPACING,
    lineHeight: TITLE_FONT_SIZE * typography.lineHeight.normal, // ~18px
  },
});
