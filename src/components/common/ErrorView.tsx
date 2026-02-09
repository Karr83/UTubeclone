/**
 * ErrorView Component
 * 
 * Centralized error display component for API errors, network failures,
 * and other recoverable error states within screens.
 * 
 * Usage:
 * <ErrorView 
 *   error="Failed to load content"
 *   onRetry={() => refetch()}
 * />
 * 
 * TODO Phase 3: Add error code mapping for user-friendly messages
 * TODO Phase 3: Add offline detection with custom messaging
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { darkTheme } from '../../theme';

interface ErrorViewProps {
  /** Error message to display */
  error: string | Error;
  /** Callback when retry button is pressed */
  onRetry?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Make it full screen */
  fullScreen?: boolean;
  /** Custom icon emoji */
  icon?: string;
  /** Additional container styles */
  style?: ViewStyle;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  error,
  onRetry,
  retryText = 'Try Again',
  fullScreen = false,
  icon = '⚠️',
  style,
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{errorMessage}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>{retryText}</Text>
        </TouchableOpacity>
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
    backgroundColor: darkTheme.semantic.background,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: darkTheme.semantic.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorView;
