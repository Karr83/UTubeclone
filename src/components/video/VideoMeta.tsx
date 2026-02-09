/**
 * VideoMeta Component
 * 
 * Displays video title, view count, and publish date.
 * Styled for YouTube dark theme.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface VideoMetaProps {
  /** Video title */
  title: string;
  /** View count (number or formatted string) */
  viewCount: number | string;
  /** Publish date (formatted string, e.g., "Oct 8, 2021") */
  publishDate: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatViews = (views: number | string): string => {
  if (typeof views === 'string') return views;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${Math.floor(views / 1_000).toLocaleString()}K views`;
  return `${views.toLocaleString()} views`;
};

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoMeta({ title, viewCount, publishDate }: VideoMetaProps): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        {formatViews(viewCount)} · {publishDate}
      </Text>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    lineHeight: 24,
  },
  meta: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
    marginTop: 4,
  },
});
