/**
 * TopMenuItem Component
 * 
 * Selectable filter chip for the TopMenu.
 * Supports active/inactive states with distinct styling.
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { sharedStyles, colors, typography, CHIP_HEIGHT, CHIP_PADDING_H, CHIP_BORDER_RADIUS } from './styles';

// =============================================================================
// TYPES
// =============================================================================

interface TopMenuItemProps {
  /** Chip label text */
  label: string;
  /** Is this chip currently selected */
  isActive?: boolean;
  /** Callback when chip is pressed */
  onPress?: () => void;
  /** Optional test ID */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TopMenuItem({
  label,
  isActive = false,
  onPress,
  testID,
}: TopMenuItemProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: CHIP_PADDING_H,
    borderRadius: CHIP_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.chipBackground,
  },
  chipActive: {
    backgroundColor: colors.chipActive,
  },
  chipText: {
    fontSize: typography.chipText.fontSize,
    fontWeight: typography.chipText.fontWeight,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.chipActiveText,
  },
});
