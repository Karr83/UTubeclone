/**
 * Membership Context
 * 
 * This context provides membership state and feature access control
 * to the entire application. It works alongside AuthContext.
 * 
 * FEATURES:
 * - Exposes current membership tier
 * - Provides canAccess(feature) helper for feature gating
 * - Provides hasMinTier(tier) helper for tier-based gating
 * - Auto-refreshes when auth state changes
 * - Handles role-based feature logic (creator features)
 * 
 * USAGE:
 * 1. Wrap your app with <MembershipProvider> (inside AuthProvider)
 * 2. Use the useMembership() hook in components
 * 
 * @example
 * // In a component
 * const { tier, canAccess, hasMinTier } = useMembership();
 * 
 * if (canAccess('content_download')) {
 *   showDownloadButton();
 * }
 * 
 * if (hasMinTier('pro')) {
 *   showPremiumFeatures();
 * }
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

import { useAuth } from './AuthContext';
import { membershipService } from '../services/membership.service';
import {
  MembershipTier,
  FeatureKey,
  TierConfig,
  MembershipContextValue,
} from '../types/membership';
import {
  getTierConfig,
  isTierAtLeast,
  DEFAULT_MEMBERSHIP_TIER,
} from '../constants/membership';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * The Membership Context instance.
 */
const MembershipContext = createContext<MembershipContextValue | undefined>(undefined);

// =============================================================================
// MEMBERSHIP PROVIDER
// =============================================================================

interface MembershipProviderProps {
  children: ReactNode;
}

/**
 * MembershipProvider component that wraps the app and provides membership state.
 * 
 * This component:
 * 1. Fetches membership tier when user authenticates
 * 2. Provides tier info and feature access helpers
 * 3. Syncs with AuthContext to stay up-to-date
 */
export function MembershipProvider({ children }: MembershipProviderProps): JSX.Element {
  // ---------------------------------------------------------------------------
  // AUTH CONTEXT
  // ---------------------------------------------------------------------------
  
  const { user, profile, isAuthenticated } = useAuth();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [tier, setTier] = useState<MembershipTier>(DEFAULT_MEMBERSHIP_TIER);
  const [loading, setLoading] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // FETCH MEMBERSHIP
  // ---------------------------------------------------------------------------

  /**
   * Fetch user's membership tier from Firestore.
   */
  const fetchMembership = useCallback(async () => {
    if (!user?.uid) {
      setTier(DEFAULT_MEMBERSHIP_TIER);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userTier = await membershipService.getMembershipTier(user.uid);
      setTier(userTier);
    } catch (error) {
      console.error('Error fetching membership:', error);
      setTier(DEFAULT_MEMBERSHIP_TIER);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Refresh membership data from server.
   * Exposed so components can trigger a refresh.
   */
  const refreshMembership = useCallback(async () => {
    await fetchMembership();
  }, [fetchMembership]);

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Fetch membership when user changes.
   */
  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  // ---------------------------------------------------------------------------
  // ACCESS CONTROL HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Get the configuration for current tier.
   */
  const tierConfig = useMemo<TierConfig>(() => {
    return getTierConfig(tier);
  }, [tier]);

  /**
   * Check if user can access a specific feature.
   * 
   * This is the main method for feature gating.
   * It considers:
   * 1. The user's membership tier
   * 2. The user's role (some features require creator role)
   * 
   * @param feature - The feature key to check
   * @returns Boolean indicating if feature is accessible
   * 
   * @example
   * if (canAccess('creator_upload_video')) {
   *   showVideoUploadButton();
   * }
   */
  const canAccess = useCallback(
    (feature: FeatureKey): boolean => {
      // Not authenticated = no access to any features
      if (!isAuthenticated) {
        return false;
      }

      // Get feature flag from tier config
      const hasFeature = tierConfig.features[feature];

      // For creator-specific features, also check role
      if (feature.startsWith('creator_')) {
        const isCreator = profile?.role === 'creator';
        return hasFeature && isCreator;
      }

      return hasFeature;
    },
    [isAuthenticated, tierConfig, profile?.role]
  );

  /**
   * Check if user's tier is at least the specified tier.
   * 
   * Useful for simple tier-based gating without specific features.
   * 
   * @param minTier - Minimum tier required
   * @returns Boolean indicating if requirement is met
   * 
   * @example
   * if (hasMinTier('basic')) {
   *   showBasicContent();
   * }
   */
  const hasMinTier = useCallback(
    (minTier: MembershipTier): boolean => {
      if (!isAuthenticated) {
        return false;
      }
      return isTierAtLeast(tier, minTier);
    },
    [isAuthenticated, tier]
  );

  // ---------------------------------------------------------------------------
  // TIER UPGRADE
  // ---------------------------------------------------------------------------

  /**
   * Initiate tier upgrade via Stripe Checkout.
   * 
   * PAYMENT FLOW:
   * 1. Create Stripe Checkout session (via Cloud Function)
   * 2. Open Stripe-hosted checkout page
   * 3. User completes payment
   * 4. Stripe webhook updates Firestore
   * 5. This context auto-refreshes via profile listener
   * 
   * @param newTier - Target tier to upgrade to
   * @param interval - Billing interval ('month' or 'year')
   * 
   * SECURITY NOTES:
   * - Payment processing happens server-side via Cloud Functions
   * - No payment data is collected in the app
   * - Tier update happens only after webhook verification
   */
  const upgradeTier = useCallback(
    async (newTier: MembershipTier): Promise<void> => {
      if (!user?.uid) {
        throw new Error('Must be authenticated to upgrade');
      }

      // Import payment service dynamically to avoid circular deps
      const { openCheckout } = await import('../services/payment.service');
      
      // Open Stripe Checkout
      const result = await openCheckout(newTier, 'month');
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start checkout');
      }
      
      // Note: Tier update will happen automatically via Stripe webhook
      // The webhook updates Firestore, which triggers profile refresh
      // Optionally force refresh after a delay:
      setTimeout(() => {
        refreshMembership();
      }, 3000);
    },
    [user?.uid, refreshMembership]
  );

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const contextValue = useMemo<MembershipContextValue>(
    () => ({
      // State
      tier,
      tierConfig,
      loading,
      
      // Helpers
      canAccess,
      hasMinTier,
      refreshMembership,
      
      // Actions
      upgradeTier,
    }),
    [tier, tierConfig, loading, canAccess, hasMinTier, refreshMembership, upgradeTier]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <MembershipContext.Provider value={contextValue}>
      {children}
    </MembershipContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * Custom hook to access membership context.
 * 
 * @returns The membership context value
 * @throws Error if used outside of MembershipProvider
 * 
 * @example
 * function ContentScreen() {
 *   const { tier, canAccess } = useMembership();
 *   
 *   return (
 *     <View>
 *       <Text>Your tier: {tier}</Text>
 *       {canAccess('content_download') && <DownloadButton />}
 *     </View>
 *   );
 * }
 */
export function useMembership(): MembershipContextValue {
  const context = useContext(MembershipContext);

  if (context === undefined) {
    throw new Error(
      'useMembership must be used within a MembershipProvider. ' +
      'Make sure to wrap your app with <MembershipProvider>.'
    );
  }

  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { MembershipContext };
export default MembershipProvider;

