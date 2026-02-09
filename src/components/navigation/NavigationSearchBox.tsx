/**
 * NavigationSearchBox Component
 * 
 * Search input component for top navigation/header.
 * Optimized for navigation bar usage with search and microphone icons.
 * 
 * Features:
 * - Search input field with placeholder
 * - Search icon button
 * - Optional microphone button
 * - Focused/unfocused states
 * - Keyboard-safe
 * - YouTube-style dark theme
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';
import { NavigationIcon } from '../icons/navigation';

// =============================================================================
// TYPES
// =============================================================================

export interface NavigationSearchBoxProps {
  /** Input value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Called when text changes */
  onChangeText?: (text: string) => void;
  /** Called when input is focused */
  onFocus?: () => void;
  /** Called when input is blurred */
  onBlur?: () => void;
  /** Called when search icon is pressed */
  onSearchPress?: () => void;
  /** Called when microphone icon is pressed */
  onMicrophonePress?: () => void;
  /** Show microphone button */
  showMicrophone?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INPUT_HEIGHT = 40;
const ICON_SIZE = 20;
const BORDER_RADIUS = 8;

// =============================================================================
// COMPONENT
// =============================================================================

export function NavigationSearchBox({
  value = '',
  placeholder = 'Search',
  onChangeText,
  onFocus,
  onBlur,
  onSearchPress,
  onMicrophonePress,
  showMicrophone = true,
  style,
}: NavigationSearchBoxProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      // Default: blur input
      // In a real implementation, you might trigger search here
    }
  };

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        style,
      ]}
    >
      {/* Search Input */}
      <TextInput
        style={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={darkTheme.semantic.textSecondary}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Search Icon Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearchPress}
        activeOpacity={0.7}
      >
        <NavigationIcon
          name="search"
          size={ICON_SIZE}
          color={darkTheme.semantic.textSecondary}
        />
      </TouchableOpacity>

      {/* Microphone Icon Button (optional) */}
      {showMicrophone && (
        <TouchableOpacity
          style={styles.microphoneButton}
          onPress={onMicrophonePress}
          activeOpacity={0.7}
        >
          <NavigationIcon
            name="microphone"
            size={ICON_SIZE}
            color={darkTheme.semantic.text}
          />
        </TouchableOpacity>
      )}
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
    height: INPUT_HEIGHT,
    backgroundColor: darkTheme.youtube.surfaceElevated,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: darkTheme.youtube.border,
    paddingHorizontal: spacing[2], // 8px
    gap: spacing[2], // 8px
  },
  containerFocused: {
    borderColor: darkTheme.youtube.blue,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.fontSize.base, // 14px
    fontWeight: typography.fontWeight.normal as any,
    color: darkTheme.semantic.text,
    paddingVertical: 0, // Remove default padding
    paddingHorizontal: 0,
  },
  searchButton: {
    width: INPUT_HEIGHT - spacing[2] * 2, // 24px
    height: INPUT_HEIGHT - spacing[2] * 2, // 24px
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.surface,
    borderRadius: BORDER_RADIUS - 2,
  },
  microphoneButton: {
    width: INPUT_HEIGHT - spacing[2] * 2, // 24px
    height: INPUT_HEIGHT - spacing[2] * 2, // 24px
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.background,
    borderRadius: BORDER_RADIUS - 2,
  },
});
