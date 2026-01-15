/**
 * Membership Service
 * 
 * This service handles all membership-related operations in Firestore.
 * It provides methods to read and update user membership tiers.
 * 
 * FIRESTORE STRUCTURE:
 * /users/{userId}
 *   - membershipTier: "free" | "basic" | "pro"
 *   - membershipUpdatedAt: Timestamp
 *   - membershipExpiresAt: Timestamp | null
 *   - membershipActive: boolean
 * 
 * FUTURE PAYMENT INTEGRATION:
 * When integrating Stripe/payments:
 * 1. upgradeTier() will create a Stripe checkout session
 * 2. A webhook will call setMembershipTier() on successful payment
 * 3. membershipExpiresAt will be set based on subscription period
 * 4. A scheduled function will downgrade expired memberships
 * 
 * USAGE:
 * import { membershipService } from '@/services/membership.service';
 * const tier = await membershipService.getMembershipTier(userId);
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { firestore } from '../config/firebase';
import { 
  MembershipTier, 
  UserMembership,
} from '../types/membership';
import { 
  DEFAULT_MEMBERSHIP_TIER,
  getTierConfig,
  isTierAtLeast,
} from '../constants/membership';

// =============================================================================
// FIRESTORE COLLECTION
// =============================================================================

/** Firestore collection for user data */
const USERS_COLLECTION = 'users';

// =============================================================================
// MEMBERSHIP SERVICE
// =============================================================================

export const membershipService = {
  /**
   * Get user's current membership tier.
   * 
   * @param userId - Firebase Auth UID
   * @returns The user's membership tier, defaults to 'free' if not found
   * 
   * @example
   * const tier = await membershipService.getMembershipTier('user123');
   * console.log(tier); // 'free' | 'basic' | 'pro'
   */
  getMembershipTier: async (userId: string): Promise<MembershipTier> => {
    try {
      const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        return DEFAULT_MEMBERSHIP_TIER;
      }
      
      const data = userDoc.data();
      const tier = data.membershipTier as MembershipTier;
      
      // Validate tier is valid, fallback to free
      if (!['free', 'basic', 'pro'].includes(tier)) {
        return DEFAULT_MEMBERSHIP_TIER;
      }
      
      return tier;
    } catch (error) {
      console.error('Error fetching membership tier:', error);
      return DEFAULT_MEMBERSHIP_TIER;
    }
  },

  /**
   * Get full membership data for a user.
   * 
   * @param userId - Firebase Auth UID
   * @returns Full membership data including expiry and status
   */
  getMembership: async (userId: string): Promise<UserMembership> => {
    try {
      const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        return {
          membershipTier: DEFAULT_MEMBERSHIP_TIER,
          membershipActive: true,
        };
      }
      
      const data = userDoc.data();
      
      return {
        membershipTier: (data.membershipTier as MembershipTier) || DEFAULT_MEMBERSHIP_TIER,
        membershipUpdatedAt: data.membershipUpdatedAt?.toDate(),
        membershipExpiresAt: data.membershipExpiresAt?.toDate() || null,
        membershipActive: data.membershipActive ?? true,
      };
    } catch (error) {
      console.error('Error fetching membership:', error);
      return {
        membershipTier: DEFAULT_MEMBERSHIP_TIER,
        membershipActive: true,
      };
    }
  },

  /**
   * Set user's membership tier.
   * 
   * This method updates the user's membership in Firestore.
   * In production, this should only be called:
   * 1. By admin manually upgrading a user
   * 2. By payment webhook on successful purchase
   * 3. By scheduled function when membership expires
   * 
   * @param userId - Firebase Auth UID
   * @param tier - New membership tier
   * @param expiresAt - Optional expiry date (null for free tier)
   * 
   * @example
   * // Upgrade user to basic tier for 1 month
   * const expiryDate = new Date();
   * expiryDate.setMonth(expiryDate.getMonth() + 1);
   * await membershipService.setMembershipTier('user123', 'basic', expiryDate);
   */
  setMembershipTier: async (
    userId: string,
    tier: MembershipTier,
    expiresAt?: Date | null
  ): Promise<void> => {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, userId);
      
      const updateData: Record<string, any> = {
        membershipTier: tier,
        membershipUpdatedAt: serverTimestamp(),
        membershipActive: true,
      };
      
      // Free tier doesn't expire
      if (tier === 'free') {
        updateData.membershipExpiresAt = null;
      } else if (expiresAt) {
        updateData.membershipExpiresAt = expiresAt;
      }
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error setting membership tier:', error);
      throw new Error('Failed to update membership tier');
    }
  },

  /**
   * Initialize membership for a new user.
   * Called during signup to set default free tier.
   * 
   * @param userId - Firebase Auth UID
   */
  initializeMembership: async (userId: string): Promise<void> => {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, userId);
      
      await setDoc(
        userRef,
        {
          membershipTier: DEFAULT_MEMBERSHIP_TIER,
          membershipUpdatedAt: serverTimestamp(),
          membershipExpiresAt: null,
          membershipActive: true,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error initializing membership:', error);
      // Don't throw - this shouldn't block signup
    }
  },

  /**
   * Check if user can access a tier-gated resource.
   * 
   * @param userId - Firebase Auth UID
   * @param requiredTier - Minimum tier required
   * @returns Boolean indicating if user has access
   * 
   * @example
   * const canAccess = await membershipService.canAccessTier('user123', 'basic');
   * if (!canAccess) {
   *   showUpgradePrompt();
   * }
   */
  canAccessTier: async (
    userId: string,
    requiredTier: MembershipTier
  ): Promise<boolean> => {
    const userTier = await membershipService.getMembershipTier(userId);
    return isTierAtLeast(userTier, requiredTier);
  },

  /**
   * Downgrade user to free tier.
   * Called when subscription expires or is cancelled.
   * 
   * @param userId - Firebase Auth UID
   */
  downgradeToFree: async (userId: string): Promise<void> => {
    await membershipService.setMembershipTier(userId, 'free', null);
  },

  /**
   * Check if membership is expired.
   * Used to determine if tier should be downgraded.
   * 
   * @param userId - Firebase Auth UID
   * @returns Boolean indicating if membership has expired
   */
  isMembershipExpired: async (userId: string): Promise<boolean> => {
    const membership = await membershipService.getMembership(userId);
    
    // Free tier never expires
    if (membership.membershipTier === 'free') {
      return false;
    }
    
    // No expiry date means it doesn't expire
    if (!membership.membershipExpiresAt) {
      return false;
    }
    
    return new Date() > membership.membershipExpiresAt;
  },

  /**
   * Prepare upgrade request.
   * This is a placeholder for payment integration.
   * 
   * In production:
   * 1. This would create a Stripe checkout session
   * 2. Return a checkout URL for the user
   * 3. Payment webhook would call setMembershipTier on success
   * 
   * @param userId - Firebase Auth UID
   * @param targetTier - Tier to upgrade to
   * @returns Placeholder response (will be checkout URL later)
   */
  prepareUpgrade: async (
    userId: string,
    targetTier: MembershipTier
  ): Promise<{ success: boolean; message: string }> => {
    // Validate upgrade
    const currentTier = await membershipService.getMembershipTier(userId);
    
    if (!isTierAtLeast(targetTier, currentTier)) {
      return {
        success: false,
        message: 'Cannot downgrade through this method',
      };
    }
    
    if (currentTier === targetTier) {
      return {
        success: false,
        message: 'Already at this tier',
      };
    }

    // PLACEHOLDER: In production, this would:
    // 1. Create Stripe checkout session
    // 2. Return checkout URL
    // For now, just return a success message
    const tierConfig = getTierConfig(targetTier);
    
    return {
      success: true,
      message: `Ready to upgrade to ${tierConfig.name} for $${tierConfig.priceMonthly}/month. Payment integration coming soon!`,
    };
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default membershipService;

