/**
 * NavigationContainer Component
 * 
 * Visual navigation container for bottom tabs and top navigation bars.
 * Provides consistent styling, spacing, and layout for navigation items.
 * 
 * Features:
 * - Bottom tab navigation layout
 * - Top navigation bar layout
 * - Consistent spacing and borders
 * - Dark theme styling
 * - Safe area handling
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme, spacing } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export type NavigationContainerVariant = 'bottom' | 'top';

export interface NavigationContainerProps {
  /** Child navigation items */
  children: React.ReactNode;
  /** Container variant (bottom tabs or top bar) */
  variant?: NavigationContainerVariant;
  /** Whether to use safe area insets */
  useSafeArea?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NavigationContainer({
  children,
  variant = 'bottom',
  useSafeArea = true,
  style,
}: NavigationContainerProps): JSX.Element {
  const containerStyle = [
    styles.container,
    variant === 'bottom' ? styles.bottomContainer : styles.topContainer,
    style,
  ];

  if (useSafeArea) {
    const edges = variant === 'bottom' ? ['bottom'] : ['top'];
    
    return (
      <SafeAreaView
        style={containerStyle}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.background,
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: darkTheme.youtube.border,
    paddingTop: spacing[1], // 4px
    paddingBottom: spacing[1], // 4px
    paddingHorizontal: spacing[2], // 8px
    minHeight: 56, // Minimum tab bar height
  },
  topContainer: {
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.youtube.border,
    paddingTop: spacing[2], // 8px
    paddingBottom: spacing[2], // 8px
    paddingHorizontal: spacing[3], // 12px
    minHeight: 56, // Minimum header height
  },
});
