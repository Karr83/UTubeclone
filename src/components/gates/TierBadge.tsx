/**
 * Tier Badge Component
 * 
 * Displays the user's membership tier as a colored badge.
 * Used throughout the app to show access level.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MembershipTier } from '../../types/membership';

// =============================================================================
// TYPES
// =============================================================================

interface TierBadgeProps {
  tier: MembershipTier | null;
  size?: 'small' | 'medium' | 'large';
}

// =============================================================================
// TIER COLORS
// =============================================================================

const tierColors: Record<MembershipTier, { bg: string; text: string }> = {
  free: { bg: '#E5E7EB', text: '#6B7280' },
  basic: { bg: '#DBEAFE', text: '#1D4ED8' },
  pro: { bg: '#E0E7FF', text: '#4338CA' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TierBadge({ tier, size = 'small' }: TierBadgeProps): JSX.Element {
  const displayTier = tier || 'free';
  const colors = tierColors[displayTier];

  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 },
    medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: sizeStyles[size].fontSize },
        ]}
      >
        {displayTier.toUpperCase()}
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default TierBadge;

