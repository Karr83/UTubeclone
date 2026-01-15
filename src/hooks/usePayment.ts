/**
 * usePayment Hook
 * 
 * This hook provides payment-related functionality to components.
 * It manages subscription state and provides upgrade/portal functions.
 * 
 * USAGE:
 * ```tsx
 * const {
 *   subscription,
 *   isLoading,
 *   isPaidMember,
 *   upgrade,
 *   openPortal,
 *   refresh,
 * } = usePayment();
 * ```
 * 
 * FEATURES UNLOCKED BY PAID TIERS:
 * - Basic: Members-only content, image uploads, basic boost
 * - Pro: Video uploads, advanced boost, higher visibility
 * - Enterprise: Unlimited boosts, team features, API access
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { MembershipTier } from '../types/membership';
import {
  UserSubscription,
  BillingInterval,
  SubscriptionStatus,
} from '../types/payment';
import {
  getCurrentSubscription,
  openCheckout,
  openCustomerPortal,
  cancelSubscription,
  hasActivePaidSubscription,
  getStatusDisplayText,
  subscriptionNeedsAttention,
} from '../services/payment.service';

// =============================================================================
// TYPES
// =============================================================================

interface UsePaymentResult {
  /** Current subscription details */
  subscription: UserSubscription | null;
  
  /** Whether subscription data is loading */
  isLoading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Whether user has an active paid subscription */
  isPaidMember: boolean;
  
  /** Whether subscription needs attention (payment failed) */
  needsAttention: boolean;
  
  /** Human-readable status text */
  statusText: string;
  
  /** Upgrade to a new tier */
  upgrade: (tier: MembershipTier, interval?: BillingInterval) => Promise<boolean>;
  
  /** Open Stripe customer portal */
  openPortal: () => Promise<boolean>;
  
  /** Cancel subscription */
  cancel: () => Promise<boolean>;
  
  /** Refresh subscription status */
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function usePayment(): UsePaymentResult {
  const { user } = useAuth();
  
  // State
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state
  const isPaidMember = subscription?.status === 'active' || subscription?.status === 'trialing';
  const needsAttention = subscription ? subscriptionNeedsAttention(subscription.status) : false;
  const statusText = subscription ? getStatusDisplayText(subscription.status) : 'Free';
  
  /**
   * Load subscription from Firestore.
   */
  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      const sub = await getCurrentSubscription();
      setSubscription(sub);
    } catch (err: any) {
      console.error('[usePayment] Failed to load subscription:', err);
      setError(err.message || 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Load subscription on mount and when user changes
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);
  
  /**
   * Upgrade to a new tier.
   * Opens Stripe Checkout in browser.
   */
  const upgrade = useCallback(async (
    tier: MembershipTier,
    interval: BillingInterval = 'month'
  ): Promise<boolean> => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to upgrade your membership.'
      );
      return false;
    }
    
    if (tier === 'free') {
      Alert.alert(
        'Invalid Tier',
        'Cannot upgrade to free tier. Use cancel to downgrade.'
      );
      return false;
    }
    
    try {
      setError(null);
      const result = await openCheckout(tier, interval);
      
      if (!result.success) {
        setError(result.error || 'Upgrade failed');
        Alert.alert('Upgrade Failed', result.error || 'Failed to start checkout.');
        return false;
      }
      
      // Refresh subscription after a delay (webhook may take a moment)
      setTimeout(() => {
        loadSubscription();
      }, 3000);
      
      return true;
    } catch (err: any) {
      console.error('[usePayment] Upgrade error:', err);
      setError(err.message || 'Upgrade failed');
      Alert.alert('Error', err.message || 'Failed to upgrade.');
      return false;
    }
  }, [user, loadSubscription]);
  
  /**
   * Open Stripe Customer Portal.
   * Allows user to manage billing, update payment method, cancel, etc.
   */
  const openPortal = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to manage your subscription.'
      );
      return false;
    }
    
    if (!subscription) {
      Alert.alert(
        'No Subscription',
        'You do not have an active subscription to manage.'
      );
      return false;
    }
    
    try {
      setError(null);
      const result = await openCustomerPortal();
      
      if (!result.success) {
        setError(result.error || 'Failed to open portal');
        Alert.alert('Error', result.error || 'Failed to open subscription manager.');
        return false;
      }
      
      // Refresh subscription when user returns
      setTimeout(() => {
        loadSubscription();
      }, 1000);
      
      return true;
    } catch (err: any) {
      console.error('[usePayment] Portal error:', err);
      setError(err.message || 'Portal failed');
      Alert.alert('Error', err.message || 'Failed to open subscription manager.');
      return false;
    }
  }, [user, subscription, loadSubscription]);
  
  /**
   * Cancel subscription.
   * Sets cancelAtPeriodEnd = true, so user keeps access until end of period.
   */
  const cancel = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in.');
      return false;
    }
    
    if (!subscription) {
      Alert.alert('No Subscription', 'No active subscription to cancel.');
      return false;
    }
    
    // Confirm cancellation
    return new Promise((resolve) => {
      Alert.alert(
        'Cancel Subscription?',
        `Your subscription will remain active until ${
          subscription.currentPeriodEnd.toLocaleDateString()
        }. After that, you'll be downgraded to the Free plan.`,
        [
          {
            text: 'Keep Subscription',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Cancel Subscription',
            style: 'destructive',
            onPress: async () => {
              try {
                setError(null);
                const result = await cancelSubscription();
                
                if (!result.success) {
                  setError(result.error || 'Cancellation failed');
                  Alert.alert('Error', result.error || 'Failed to cancel subscription.');
                  resolve(false);
                  return;
                }
                
                Alert.alert(
                  'Subscription Canceled',
                  `Your subscription will end on ${subscription.currentPeriodEnd.toLocaleDateString()}.`
                );
                
                // Refresh subscription
                await loadSubscription();
                resolve(true);
              } catch (err: any) {
                console.error('[usePayment] Cancel error:', err);
                setError(err.message || 'Cancellation failed');
                Alert.alert('Error', err.message || 'Failed to cancel subscription.');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }, [user, subscription, loadSubscription]);
  
  /**
   * Refresh subscription status.
   */
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await loadSubscription();
  }, [loadSubscription]);
  
  return {
    subscription,
    isLoading,
    error,
    isPaidMember,
    needsAttention,
    statusText,
    upgrade,
    openPortal,
    cancel,
    refresh,
  };
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to check if user can upgrade to a specific tier.
 * 
 * USAGE:
 * ```tsx
 * const canUpgrade = useCanUpgrade('pro');
 * ```
 */
export function useCanUpgrade(targetTier: MembershipTier): boolean {
  const { subscription } = usePayment();
  
  // Tier hierarchy
  const tierOrder: MembershipTier[] = ['free', 'basic', 'pro', 'enterprise'];
  
  const currentTier = subscription?.tier || 'free';
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);
  
  return targetIndex > currentIndex;
}

/**
 * Hook to check if a feature is available with current subscription.
 * 
 * USAGE:
 * ```tsx
 * const hasFeature = useHasFeature('video_upload');
 * ```
 */
export function useSubscriptionFeature(feature: string): boolean {
  const { subscription, isPaidMember } = usePayment();
  
  // Feature availability by tier
  const FEATURES_BY_TIER: Record<MembershipTier, string[]> = {
    free: ['view_public', 'basic_support'],
    basic: ['view_public', 'view_members', 'image_upload', 'basic_boost', 'priority_support'],
    pro: ['view_public', 'view_members', 'image_upload', 'video_upload', 'advanced_boost', 'premium_support', 'analytics'],
    enterprise: ['view_public', 'view_members', 'image_upload', 'video_upload', 'unlimited_boost', 'team_management', 'api_access', 'dedicated_support'],
  };
  
  const currentTier = subscription?.tier || 'free';
  const tierFeatures = FEATURES_BY_TIER[currentTier] || [];
  
  return tierFeatures.includes(feature);
}

export default usePayment;

