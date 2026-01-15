/**
 * Analytics Screen
 * 
 * Placeholder screen for creator analytics.
 * Will show detailed stats about content performance.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AnalyticsScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>📊</Text>
        <Text style={styles.text}>Analytics coming soon</Text>
        <Text style={styles.subtext}>
          View detailed stats about your content performance.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

