/**
 * Upgrade Prompt Component
 * 
 * Displays a prompt to upgrade membership tier.
 * Used when a feature requires a higher tier.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MembershipTier } from '../../types/membership';

// =============================================================================
// TYPES
// =============================================================================

interface UpgradePromptProps {
  requiredTier: MembershipTier;
  feature: string;
  onUpgrade?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UpgradePrompt({
  requiredTier,
  feature,
  onUpgrade,
}: UpgradePromptProps): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>Upgrade Required</Text>
      <Text style={styles.description}>
        {feature} requires {requiredTier} tier or higher.
      </Text>
      {onUpgrade && (
        <TouchableOpacity style={styles.button} onPress={onUpgrade}>
          <Text style={styles.buttonText}>Upgrade Now</Text>
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
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    margin: 16,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UpgradePrompt;

