/**
 * EmptyState Component
 * 
 * Displays a consistent empty state UI for lists and data views.
 * 
 * Usage:
 * <EmptyState 
 *   icon="📭"
 *   title="No videos yet"
 *   message="Check back later for new content"
 * />
 * 
 * TODO Phase 3: Add action button support
 * TODO Phase 3: Add animated illustrations
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { darkTheme } from '../../theme';

interface EmptyStateProps {
  /** Icon emoji to display */
  icon?: string;
  /** Main title */
  title: string;
  /** Description message */
  message?: string;
  /** Additional styles */
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  message,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});

export default EmptyState;
