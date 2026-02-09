/**
 * AppButton Component
 * 
 * Core design system button component with multiple variants.
 * Used throughout the app for consistent button styling.
 * 
 * Features:
 * - Primary, secondary, and ghost variants
 * - Loading state with spinner
 * - Left/right icon support
 * - Disabled state
 * - Full width option
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { darkTheme, spacing, typography, borderRadius } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface AppButtonProps {
  /** Button label text */
  label: string;
  /** Called when button is pressed */
  onPress: () => void;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Optional icon on the left side */
  leftIcon?: React.ReactNode;
  /** Optional icon on the right side */
  rightIcon?: React.ReactNode;
  /** Whether button should take full width */
  fullWidth?: boolean;
  /** Custom background color (overrides variant default) */
  backgroundColor?: string;
  /** Custom text color (overrides variant default) */
  textColor?: string;
  /** Additional container style */
  style?: ViewStyle;
  /** Additional text style */
  textStyle?: TextStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BUTTON_HEIGHT = 44;
const BUTTON_PADDING_HORIZONTAL = spacing[6]; // 24px
const BUTTON_PADDING_VERTICAL = spacing[3]; // 12px
const BUTTON_BORDER_RADIUS = borderRadius.md; // 8px
const ICON_SPACING = spacing[2]; // 8px

// =============================================================================
// COMPONENT
// =============================================================================

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  backgroundColor,
  textColor,
  style,
  textStyle,
}: AppButtonProps): JSX.Element {
  const isDisabled = disabled || loading;
  const variantStyles = styles[variant];
  const variantTextStyles = styles[`${variant}Text`];
  const disabledStyles = isDisabled ? styles.disabled : null;
  const disabledTextStyles = isDisabled ? styles.disabledText : null;

  // Custom colors override variant defaults
  const customBgStyle = backgroundColor ? { backgroundColor } : null;
  const customTextStyle = textColor ? { color: textColor } : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        variantStyles,
        customBgStyle,
        disabledStyles,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? darkTheme.youtube.buttonPrimaryText : darkTheme.youtube.buttonPrimary}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <View style={styles.leftIcon}>
              {leftIcon}
            </View>
          )}
          <Text
            style={[
              styles.text,
              variantTextStyles,
              customTextStyle,
              disabledTextStyles,
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon && (
            <View style={styles.rightIcon}>
              {rightIcon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 120,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold as any,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: ICON_SPACING,
  },
  rightIcon: {
    marginLeft: ICON_SPACING,
  },
  fullWidth: {
    width: '100%',
    minWidth: '100%',
  },
  
  // Variants
  primary: {
    backgroundColor: darkTheme.youtube.buttonPrimary,
  },
  primaryText: {
    color: darkTheme.youtube.buttonPrimaryText,
  },
  
  secondary: {
    backgroundColor: darkTheme.youtube.buttonSecondary,
    borderWidth: 1,
    borderColor: darkTheme.youtube.buttonSecondaryBorder,
  },
  secondaryText: {
    color: darkTheme.youtube.buttonSecondaryText,
  },
  
  ghost: {
    backgroundColor: darkTheme.youtube.buttonGhost,
  },
  ghostText: {
    color: darkTheme.youtube.buttonGhostText,
  },
  
  // States
  disabled: {
    backgroundColor: darkTheme.youtube.buttonDisabled,
    borderColor: darkTheme.youtube.buttonDisabled,
    opacity: 0.6,
  },
  disabledText: {
    color: darkTheme.youtube.buttonDisabledText,
  },
});
