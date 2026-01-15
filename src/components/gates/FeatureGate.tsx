/**
 * Feature Gate Components
 * 
 * These components provide declarative feature gating in the UI.
 * Wrap content that should only be visible to certain tiers/features.
 * 
 * USAGE:
 * 
 * 1. FeatureGate - Gate by specific feature key
 * <FeatureGate feature="content_download">
 *   <DownloadButton />
 * </FeatureGate>
 * 
 * 2. TierGate - Gate by minimum tier level
 * <TierGate minTier="pro">
 *   <PremiumContent />
 * </TierGate>
 * 
 * 3. With fallback
 * <FeatureGate feature="premium_no_ads" fallback={<AdBanner />}>
 *   {null}
 * </FeatureGate>
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useMembership } from '../../contexts/MembershipContext';
import { 
  FeatureKey, 
  MembershipTier,
  FeatureGateProps,
  TierGateProps,
} from '../../types/membership';
import { getTierConfig } from '../../constants/membership';

// =============================================================================
// FEATURE GATE
// =============================================================================

/**
 * FeatureGate component for feature-based access control.
 * 
 * Renders children only if the user has access to the specified feature.
 * Optionally renders a fallback if access is denied.
 * 
 * @example
 * <FeatureGate feature="content_download">
 *   <Button title="Download" onPress={handleDownload} />
 * </FeatureGate>
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: FeatureGateProps): JSX.Element | null {
  const { canAccess } = useMembership();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// =============================================================================
// TIER GATE
// =============================================================================

/**
 * TierGate component for tier-based access control.
 * 
 * Renders children only if the user's tier meets the minimum requirement.
 * Optionally renders a fallback if requirement is not met.
 * 
 * @example
 * <TierGate minTier="pro">
 *   <Text>This is exclusive Pro content!</Text>
 * </TierGate>
 */
export function TierGate({ 
  minTier, 
  children, 
  fallback = null 
}: TierGateProps): JSX.Element | null {
  const { hasMinTier } = useMembership();

  if (hasMinTier(minTier)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// =============================================================================
// UPGRADE PROMPT
// =============================================================================

interface UpgradePromptProps {
  /** Feature that requires upgrade */
  feature?: FeatureKey;
  /** Minimum tier required */
  requiredTier?: MembershipTier;
  /** Custom message */
  message?: string;
  /** Callback when upgrade button is pressed */
  onUpgrade?: () => void;
}

/**
 * UpgradePrompt component shown when user lacks access.
 * 
 * Use as a fallback in FeatureGate or TierGate to prompt upgrades.
 * 
 * @example
 * <FeatureGate 
 *   feature="content_download"
 *   fallback={<UpgradePrompt requiredTier="basic" />}
 * >
 *   <DownloadButton />
 * </FeatureGate>
 */
export function UpgradePrompt({
  feature,
  requiredTier = 'basic',
  message,
  onUpgrade,
}: UpgradePromptProps): JSX.Element {
  const { tier } = useMembership();
  const targetTierConfig = getTierConfig(requiredTier);

  const defaultMessage = `Upgrade to ${targetTierConfig.name} to unlock this feature`;

  return (
    <View style={styles.promptContainer}>
      <Text style={styles.lockIcon}>🔒</Text>
      <Text style={styles.promptMessage}>
        {message || defaultMessage}
      </Text>
      <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
        <Text style={styles.upgradeButtonText}>
          Upgrade to {targetTierConfig.name}
        </Text>
      </TouchableOpacity>
      <Text style={styles.currentTier}>
        Current tier: {tier.toUpperCase()}
      </Text>
    </View>
  );
}

// =============================================================================
// LOCKED OVERLAY
// =============================================================================

interface LockedOverlayProps {
  /** Minimum tier required to unlock */
  requiredTier: MembershipTier;
  /** Children to show behind the lock */
  children: ReactNode;
  /** Callback when unlock button is pressed */
  onUnlock?: () => void;
}

/**
 * LockedOverlay component for content that should be visible but locked.
 * 
 * Shows a blurred/dimmed preview with an unlock prompt overlay.
 * 
 * @example
 * <LockedOverlay requiredTier="pro" onUnlock={showUpgradeModal}>
 *   <PremiumVideoPreview />
 * </LockedOverlay>
 */
export function LockedOverlay({
  requiredTier,
  children,
  onUnlock,
}: LockedOverlayProps): JSX.Element {
  const { hasMinTier } = useMembership();
  const tierConfig = getTierConfig(requiredTier);

  if (hasMinTier(requiredTier)) {
    return <>{children}</>;
  }

  return (
    <View style={styles.lockedContainer}>
      <View style={styles.lockedContent}>
        {children}
      </View>
      <View style={styles.lockedOverlay}>
        <Text style={styles.lockIconLarge}>🔒</Text>
        <Text style={styles.lockedTitle}>
          {tierConfig.name} Content
        </Text>
        <Text style={styles.lockedDescription}>
          Upgrade to {tierConfig.name} to access this content
        </Text>
        <TouchableOpacity style={styles.unlockButton} onPress={onUnlock}>
          <Text style={styles.unlockButtonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// TIER BADGE
// =============================================================================

interface TierBadgeProps {
  /** Tier to display */
  tier: MembershipTier;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * TierBadge component to display a user's tier.
 * 
 * @example
 * <TierBadge tier={userTier} size="medium" />
 */
export function TierBadge({ tier, size = 'medium' }: TierBadgeProps): JSX.Element {
  const tierConfig = getTierConfig(tier);
  
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 },
    medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  };

  return (
    <View 
      style={[
        styles.badge, 
        { backgroundColor: tierConfig.badgeColor },
        { 
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: sizeStyles[size].fontSize }]}>
        {tierConfig.name.toUpperCase()}
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Upgrade Prompt
  promptContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 8,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  promptMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  currentTier: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },

  // Locked Overlay
  lockedContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  lockedContent: {
    opacity: 0.3,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIconLarge: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 20,
  },
  unlockButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Tier Badge
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

