/**
 * Sidebar Component
 * 
 * Outer sidebar / drawer container component.
 * Provides the shell/layout wrapper for SidebarMenu.
 * 
 * Features:
 * - Full-height vertical container
 * - Dark background
 * - Safe area handling
 * - Proper width and padding
 * - YouTube-style dark theme
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

export interface SidebarProps {
  /** Child components (typically SidebarMenu) */
  children?: React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
  /** Sidebar width (default: 280px) */
  width?: number;
  /** Whether to use safe area insets (default: true) */
  useSafeArea?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_WIDTH = 280; // Standard drawer width

// =============================================================================
// COMPONENT
// =============================================================================

export function Sidebar({
  children,
  style,
  width = DEFAULT_WIDTH,
  useSafeArea = true,
}: SidebarProps): JSX.Element {
  const containerStyle = [
    styles.container,
    { width },
    style,
  ];

  if (useSafeArea) {
    return (
      <SafeAreaView
        style={containerStyle}
        edges={['top', 'left', 'bottom']}
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
    flex: 1,
    backgroundColor: darkTheme.semantic.background,
    // No horizontal padding - SidebarMenu handles its own padding
  },
});
