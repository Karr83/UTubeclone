/**
 * LoadingView Component
 * 
 * Centralized loading display component with support for both
 * light and dark themes, full screen and inline modes.
 * 
 * Usage:
 * <LoadingView message="Loading content..." />
 * <LoadingView fullScreen />
 * 
 * TODO Phase 3: Add skeleton loading variants
 * TODO Phase 3: Add progress indicator support
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { darkTheme } from '../../theme';

interface LoadingViewProps {
  /** Optional loading message */
  message?: string;
  /** Make it full screen */
  fullScreen?: boolean;
  /** Spinner size */
  size?: 'small' | 'large';
  /** Use light theme */
  light?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
}

const LoadingView: React.FC<LoadingViewProps> = ({
  message,
  fullScreen = false,
  size = 'large',
  light = false,
  style,
}) => {
  const backgroundColor = light ? '#FFFFFF' : darkTheme.semantic.background;
  const textColor = light ? '#1F2937' : darkTheme.semantic.text;
  const spinnerColor = light ? '#6366F1' : '#FFFFFF';

  return (
    <View
      style={[
        styles.container,
        fullScreen && [styles.fullScreen, { backgroundColor }],
        style,
      ]}
    >
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoadingView;
