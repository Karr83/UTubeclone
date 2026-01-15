/**
 * Boost Hook
 * 
 * This hook provides content boosting functionality with:
 * - Eligibility checking based on role and tier
 * - Boost and remove boost actions
 * - Loading and error state management
 * 
 * USAGE:
 * const { canBoost, maxLevel, boost, removeBoost, isLoading } = useBoost(contentId);
 * 
 * FUTURE PAYMENT INTEGRATION:
 * When adding payments, extend this hook with:
 * - purchaseBoost(level, duration, paymentToken)
 * - availablePaidOptions
 * - isPaymentRequired(level)
 */

import { useState, useCallback, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../contexts/MembershipContext';
import { boostService } from '../services/boost.service';
import {
  BoostLevel,
  BoostDuration,
  BoostEligibility,
  BoostContentResult,
} from '../types/content';

// =============================================================================
// TYPES
// =============================================================================

interface UseBoostReturn {
  /** Whether user can boost this content */
  canBoost: boolean;
  
  /** Whether content is currently boosted */
  isBoosted: boolean;
  
  /** Maximum boost level available to user */
  maxLevel: BoostLevel;
  
  /** Available boost durations */
  availableDurations: BoostDuration[];
  
  /** Reason if cannot boost */
  ineligibleReason?: string;
  
  /** Boost content */
  boost: (level?: BoostLevel, duration?: BoostDuration) => Promise<BoostContentResult>;
  
  /** Remove boost from content */
  removeBoost: () => Promise<{ success: boolean; error?: string }>;
  
  /** Whether boost operation is in progress */
  isLoading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Refresh eligibility check */
  refreshEligibility: () => Promise<void>;
  
  /**
   * FUTURE PAYMENT INTEGRATION:
   * Add these when implementing payments:
   * 
   * purchaseBoost: (level, duration, paymentToken) => Promise<BoostPurchaseResult>;
   * availablePaidOptions: BoostTierConfig[];
   * isPaymentRequired: (level: BoostLevel) => boolean;
   */
}

// =============================================================================
// HOOK
// =============================================================================

export function useBoost(contentId: string): UseBoostReturn {
  const { user, profile } = useAuth();
  const { canAccess } = useMembership();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [eligibility, setEligibility] = useState<BoostEligibility | null>(null);
  const [isBoosted, setIsBoosted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // ELIGIBILITY CHECK
  // ---------------------------------------------------------------------------

  const checkEligibility = useCallback(async () => {
    if (!user?.uid || !contentId) {
      setEligibility(null);
      return;
    }

    try {
      const result = await boostService.checkBoostEligibility(user.uid, contentId);
      setEligibility(result);
    } catch (err) {
      console.error('Error checking boost eligibility:', err);
      setEligibility(null);
    }
  }, [user?.uid, contentId]);

  // Initial eligibility check
  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  // ---------------------------------------------------------------------------
  // BOOST CONTENT
  // ---------------------------------------------------------------------------

  /**
   * Boost the content with specified level and duration.
   * 
   * FUTURE PAYMENT INTEGRATION:
   * If level > maxLevel, this should prompt for payment:
   * ```typescript
   * if (level > eligibility.maxLevel) {
   *   const paymentResult = await showPaymentSheet(getBoostPrice(level, duration));
   *   if (!paymentResult.success) {
   *     return { success: false, error: 'Payment cancelled' };
   *   }
   *   return boostService.purchaseBoost(contentId, level, duration, paymentResult.token);
   * }
   * ```
   */
  const boost = useCallback(
    async (
      level: BoostLevel = 1,
      duration: BoostDuration = '24h'
    ): Promise<BoostContentResult> => {
      if (!user?.uid) {
        return { success: false, error: 'Not authenticated', level: 1 };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await boostService.boostContent(
          { contentId, level, duration },
          user.uid
        );

        if (result.success) {
          setIsBoosted(true);
          // Refresh eligibility after boost
          await checkEligibility();
        } else {
          setError(result.error || 'Failed to boost content');
        }

        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to boost content';
        setError(errorMsg);
        return { success: false, error: errorMsg, level: 1 };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, contentId, checkEligibility]
  );

  // ---------------------------------------------------------------------------
  // REMOVE BOOST
  // ---------------------------------------------------------------------------

  const removeBoost = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!user?.uid) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const isAdmin = profile?.role === 'admin';
      const result = await boostService.removeBoost(contentId, user.uid, isAdmin);

      if (result.success) {
        setIsBoosted(false);
        // Refresh eligibility after removing boost
        await checkEligibility();
      } else {
        setError(result.error || 'Failed to remove boost');
      }

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove boost';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, profile?.role, contentId, checkEligibility]);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  // Convert eligibility reason to user-friendly message
  const getIneligibleMessage = (reason?: string): string | undefined => {
    switch (reason) {
      case 'not_creator':
        return 'Only creators can boost their own content';
      case 'insufficient_tier':
        return 'Upgrade to Basic tier to boost content';
      case 'content_not_published':
        return 'Only published content can be boosted';
      case 'already_boosted':
        return 'This content is already boosted';
      case 'suspended':
        return 'Your account is suspended';
      default:
        return undefined;
    }
  };

  return {
    canBoost: eligibility?.canBoost ?? false,
    isBoosted,
    maxLevel: eligibility?.maxLevel ?? 1,
    availableDurations: eligibility?.availableDurations ?? [],
    ineligibleReason: getIneligibleMessage(eligibility?.reason),
    boost,
    removeBoost,
    isLoading,
    error,
    refreshEligibility: checkEligibility,
  };
}

export default useBoost;

// =============================================================================
// ADMIN BOOST HOOK
// =============================================================================

/**
 * Admin-specific boost hook for force boosting any content.
 * 
 * USAGE:
 * const { forceBoost, removeBoost, isLoading } = useAdminBoost();
 */
export function useAdminBoost() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  /**
   * Force boost any content (admin only).
   */
  const forceBoost = useCallback(
    async (
      contentId: string,
      level: BoostLevel = 4,
      duration: BoostDuration = 'unlimited'
    ): Promise<BoostContentResult> => {
      if (!user?.uid || !isAdmin) {
        return { success: false, error: 'Admin access required', level: 1 };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await boostService.adminForceBoost(
          contentId,
          user.uid,
          level,
          duration
        );

        if (!result.success) {
          setError(result.error || 'Failed to boost content');
        }

        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to boost content';
        setError(errorMsg);
        return { success: false, error: errorMsg, level: 1 };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, isAdmin]
  );

  /**
   * Remove boost from any content (admin only).
   */
  const adminRemoveBoost = useCallback(
    async (contentId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid || !isAdmin) {
        return { success: false, error: 'Admin access required' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await boostService.adminRemoveBoost(contentId, user.uid);

        if (!result.success) {
          setError(result.error || 'Failed to remove boost');
        }

        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to remove boost';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, isAdmin]
  );

  return {
    isAdmin,
    forceBoost,
    removeBoost: adminRemoveBoost,
    isLoading,
    error,
  };
}

