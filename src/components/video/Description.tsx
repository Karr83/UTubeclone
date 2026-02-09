/**
 * Description Component
 * 
 * Expandable video description with "Show More" toggle.
 * Truncates to specified lines when collapsed.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface DescriptionProps {
  /** Description text content */
  text: string;
  /** Maximum lines when collapsed (default: 3) */
  maxLines?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Description({ text, maxLines = 3 }: DescriptionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return <View />;
  }

  return (
    <View style={styles.container}>
      <Text
        style={styles.text}
        numberOfLines={isExpanded ? undefined : maxLines}
      >
        {text}
      </Text>
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.toggleText}>
          {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.divider,
  },
  text: {
    fontSize: 14,
    color: darkTheme.semantic.text,
    lineHeight: 20,
  },
  toggleButton: {
    marginTop: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.semantic.textSecondary,
    letterSpacing: 0.3,
  },
});
