/**
 * Boost Button Component
 * 
 * Minimal button for boosting content.
 * Shows boost status and allows boost/unboost actions.
 * 
 * USAGE:
 * <BoostButton contentId="abc123" onBoostChange={refresh} />
 * 
 * FUTURE PAYMENT INTEGRATION:
 * When payments are added, this component will:
 * 1. Show pricing for higher boost levels
 * 2. Open payment sheet for paid boosts
 * 3. Display purchase confirmation
 * 
 * Example future flow:
 * ```
 * <BoostButton
 *   contentId={id}
 *   onBoostChange={refresh}
 *   showPaidOptions={true}  // Show upgrade options
 *   onPurchase={(level, price) => openPaymentSheet(level, price)}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useBoost } from '../../hooks/useBoost';
import { BoostLevel, BoostDuration, Content } from '../../types/content';

// =============================================================================
// TYPES
// =============================================================================

interface BoostButtonProps {
  /** Content to boost */
  content: Content;
  
  /** Callback when boost status changes */
  onBoostChange?: () => void;
  
  /** Show compact version */
  compact?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BoostButton({
  content,
  onBoostChange,
  compact = false,
}: BoostButtonProps): JSX.Element {
  const {
    canBoost,
    isBoosted: hookIsBoosted,
    maxLevel,
    availableDurations,
    ineligibleReason,
    boost,
    removeBoost,
    isLoading,
    error,
  } = useBoost(content.id);

  // Use content's boost state or hook state
  const isBoosted = content.isBoosted || hookIsBoosted;

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleBoost = async () => {
    if (!canBoost) {
      Alert.alert('Cannot Boost', ineligibleReason || 'You cannot boost this content');
      return;
    }

    // Use the best available level and duration
    const level = maxLevel;
    const duration = availableDurations[availableDurations.length - 1] || '24h';

    Alert.alert(
      'Boost Content',
      `Boost this content with Level ${level} boost for ${duration}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Boost',
          onPress: async () => {
            const result = await boost(level, duration);
            if (result.success) {
              Alert.alert('Success', 'Content boosted successfully!');
              onBoostChange?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to boost content');
            }
          },
        },
      ]
    );
  };

  const handleRemoveBoost = async () => {
    Alert.alert(
      'Remove Boost',
      'Are you sure you want to remove the boost from this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeBoost();
            if (result.success) {
              Alert.alert('Success', 'Boost removed');
              onBoostChange?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove boost');
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={[styles.button, styles.loadingButton]}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  // Content is already boosted - show remove button
  if (isBoosted) {
    return (
      <View style={compact ? styles.compactContainer : styles.container}>
        <View style={styles.boostedBadge}>
          <Text style={styles.boostedText}>
            🚀 Boosted (L{content.boostLevel || 1})
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.removeButton]}
          onPress={handleRemoveBoost}
        >
          <Text style={styles.removeButtonText}>Remove Boost</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Can boost - show boost button
  if (canBoost) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.boostButton]}
        onPress={handleBoost}
      >
        <Text style={styles.boostButtonText}>
          🚀 Boost {maxLevel > 1 ? `(L${maxLevel})` : ''}
        </Text>
      </TouchableOpacity>
    );
  }

  // Cannot boost - show disabled state with reason
  return (
    <TouchableOpacity
      style={[styles.button, styles.disabledButton]}
      onPress={() => Alert.alert('Cannot Boost', ineligibleReason || 'Boost unavailable')}
    >
      <Text style={styles.disabledButtonText}>
        🔒 {compact ? 'Upgrade' : 'Upgrade to Boost'}
      </Text>
    </TouchableOpacity>
  );
}

// =============================================================================
// ADMIN BOOST BUTTON
// =============================================================================

interface AdminBoostButtonProps {
  content: Content;
  onBoostChange?: () => void;
}

/**
 * Admin-only boost button for force boosting content.
 */
export function AdminBoostButton({
  content,
  onBoostChange,
}: AdminBoostButtonProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  
  // Import admin boost functionality directly to avoid hook complexity
  const handleAdminBoost = async () => {
    const { boostService } = await import('../../services/boost.service');
    const { auth } = await import('../../config/firebase');
    
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Admin Boost',
      `Force boost this content with Featured level?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Boost',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await boostService.adminForceBoost(
                content.id,
                user.uid,
                4, // Featured level
                '7d'
              );
              if (result.success) {
                Alert.alert('Success', 'Content boosted by admin');
                onBoostChange?.();
              } else {
                Alert.alert('Error', result.error || 'Failed');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAdminRemoveBoost = async () => {
    const { boostService } = await import('../../services/boost.service');
    const { auth } = await import('../../config/firebase');
    
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Remove Boost',
      'Remove boost from this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await boostService.adminRemoveBoost(content.id, user.uid);
              if (result.success) {
                Alert.alert('Success', 'Boost removed');
                onBoostChange?.();
              } else {
                Alert.alert('Error', result.error || 'Failed');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.button, styles.loadingButton]}>
        <ActivityIndicator size="small" color="#DC2626" />
      </View>
    );
  }

  if (content.isBoosted) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.adminRemoveButton]}
        onPress={handleAdminRemoveBoost}
      >
        <Text style={styles.adminRemoveButtonText}>🛡️ Remove Boost</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.adminBoostButton]}
      onPress={handleAdminBoost}
    >
      <Text style={styles.adminBoostButtonText}>🛡️ Admin Boost</Text>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES (Minimal - no heavy styling as per requirements)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingButton: {
    backgroundColor: '#F3F4F6',
    minWidth: 100,
  },
  boostButton: {
    backgroundColor: '#6366F1',
  },
  boostButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
  },
  disabledButtonText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
  },
  boostedBadge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  boostedText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  // Admin styles
  adminBoostButton: {
    backgroundColor: '#DC2626',
  },
  adminBoostButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  adminRemoveButton: {
    backgroundColor: '#FEF3C7',
  },
  adminRemoveButtonText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default BoostButton;

