/**
 * LoadingSpinner Component - Activity indicator wrapper
 * 
 * Simple loading spinner with theme support.
 * For more complex loading states, use LoadingView instead.
 * 
 * TODO Phase 3: Add pulse animation option
 * TODO Phase 3: Add branded loading animation
 */
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const LoadingSpinner = ({ 
  size = 'large', 
  color,
  fullScreen = false,
  dark = true,
  style,
}) => {
  // Default to white spinner for dark theme, primary for light
  const spinnerColor = color || (dark ? '#FFFFFF' : '#6366F1');
  const backgroundColor = dark ? '#0B0B0B' : '#FFFFFF';

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor }, style]}>
        <ActivityIndicator size={size} color={spinnerColor} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={spinnerColor} style={style} />;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;

