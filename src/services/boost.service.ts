/**
 * Boost Service
 * 
 * This service handles all content boost/promotion operations:
 * - Boosting content for higher visibility
 * - Removing boosts
 * - Querying boosted content
 * - Checking boost eligibility
 * 
 * BOOST ARCHITECTURE:
 * - Boosted content appears first in feeds (sorted by boostLevel DESC, then createdAt DESC)
 * - Only creators can boost their own content
 * - Only certain membership tiers can boost (Pro tier for basic boosts)
 * - Admins can force boost any content or remove boosts
 * 
 * FUTURE PAYMENT INTEGRATION:
 * ================================
 * When adding payments, this service will need:
 * 
 * 1. Payment Processing:
 *    - Integrate with Stripe/RevenueCat/in-app purchases
 *    - Add purchaseBoost(contentId, level, paymentToken) method
 *    - Validate payment before applying boost
 * 
 * 2. Price Configuration:
 *    - Store boost prices in Firestore /config/boostPricing
 *    - Support different prices per level and duration
 *    - Handle currency conversion if needed
 * 
 * 3. Transaction Logging:
 *    - Store all boost purchases in /boostTransactions collection
 *    - Track revenue per creator and platform-wide
 *    - Support refunds
 * 
 * 4. Subscription Benefits:
 *    - Pro tier gets X free boosts per month
 *    - Track usage in /users/{uid}/boostUsage subcollection
 *    - Reset monthly via Cloud Function
 * 
 * Example future payment flow:
 * ```typescript
 * async purchaseBoost(
 *   contentId: string,
 *   level: BoostLevel,
 *   duration: BoostDuration,
 *   paymentToken: string
 * ): Promise<BoostPurchaseResult> {
 *   // 1. Validate payment with Stripe
 *   const payment = await stripeService.chargeCard(paymentToken, getBoostPrice(level, duration));
 *   
 *   // 2. Apply boost if payment successful
 *   if (payment.success) {
 *     await this.boostContent(contentId, level, duration, 'paid');
 *     await logTransaction(contentId, payment.id, level, duration);
 *     return { success: true, transactionId: payment.id };
 *   }
 *   
 *   return { success: false, error: payment.error };
 * }
 * ```
 */

/* PHASE 2: Firebase imports commented out
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  collection,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
*/

// PHASE 3B: Import real Firebase functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
  Content,
  BoostLevel,
  BoostDuration,
  BoostContentRequest,
  BoostContentResult,
  BoostEligibility,
  ContentListResponse,
} from '../types/content';
import { UserProfile } from '../types/auth';

// =============================================================================
// CONSTANTS
// =============================================================================

const CONTENT_COLLECTION = 'content';
const USERS_COLLECTION = 'users';

/**
 * Duration in milliseconds for each boost duration option.
 * 
 * FUTURE: Make this configurable via Firestore config for dynamic pricing
 */
const BOOST_DURATION_MS: Record<BoostDuration, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '48h': 48 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'unlimited': Infinity,
};

/**
 * Maximum boost level available per membership tier.
 * 
 * FUTURE PAYMENT INTEGRATION:
 * - Add 'paid' option for levels 3-5
 * - Map to Stripe price IDs for each level
 */
const TIER_MAX_BOOST_LEVEL: Record<string, BoostLevel> = {
  free: 0 as any, // Cannot boost
  basic: 1,       // Basic boost only
  pro: 2,         // Standard boost
};

/**
 * Available durations per membership tier for FREE boosts.
 * 
 * FUTURE PAYMENT INTEGRATION:
 * - Paid boosts can have longer durations
 * - Store config in Firestore for dynamic updates
 */
const TIER_BOOST_DURATIONS: Record<string, BoostDuration[]> = {
  free: [],
  basic: ['24h'],
  pro: ['24h', '48h'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate boost expiration timestamp.
 */
function calculateExpiresAt(duration: BoostDuration): Date | null {
  if (duration === 'unlimited') return null;
  return new Date(Date.now() + BOOST_DURATION_MS[duration]);
}

/**
 * Check if a boost has expired.
 */
function isBoostExpired(expiresAt?: Date | null): boolean {
  if (!expiresAt) return false; // Unlimited boosts never expire
  return new Date() > expiresAt;
}

/**
 * Convert Firestore document to Content object.
 */
function docToContent(docId: string, data: any): Content {
  return {
    id: docId,
    creatorId: data.creatorId,
    title: data.title || '',
    description: data.description,
    mediaType: data.mediaType || 'image',
    mediaUrl: data.mediaUrl || '',
    thumbnailUrl: data.thumbnailUrl,
    visibility: data.visibility || 'public',
    status: data.status || 'published',
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate(),
    publishedAt: data.publishedAt?.toDate(),
    viewCount: data.viewCount || 0,
    likeCount: data.likeCount || 0,
    commentCount: data.commentCount || 0,
    // Boost fields
    isBoosted: data.isBoosted || false,
    boostLevel: data.boostLevel || 0,
    boostedAt: data.boostedAt?.toDate(),
    boostedBy: data.boostedBy,
    boostExpiresAt: data.boostExpiresAt?.toDate() || null,
  };
}

// =============================================================================
// BOOST SERVICE
// =============================================================================

export const boostService = {
  /**
   * Check if a user can boost content.
   * 
   * @param userId - User ID to check
   * @param contentId - Content ID to boost
   * @returns Eligibility result with available options
   * 
   * FUTURE PAYMENT INTEGRATION:
   * - Add availablePaidOptions to result
   * - Check if user has payment method on file
   * - Return pricing information
   */
  checkBoostEligibility: async (
    userId: string,
    contentId: string
  ): Promise<BoostEligibility> => {
    // PHASE 3B: Return default eligibility if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, returning default boost eligibility');
      return {
        canBoost: false,
        maxLevel: 1,
        availableDurations: [],
        reason: 'firebase_offline',
      };
    }

    try {
      // Get user profile
      const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, userId));
      if (!userDoc.exists()) {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'not_creator',
        };
      }
      
      const userData = userDoc.data();
      const userRole = userData.role;
      const userTier = userData.membershipTier || 'free';
      const userStatus = userData.status || 'active';
      
      // Check if suspended
      if (userStatus === 'suspended' || userStatus === 'banned') {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'suspended',
        };
      }
      
      // Check if creator
      if (userRole !== 'creator') {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'not_creator',
        };
      }
      
      // Get content
      const contentDoc = await getDoc(doc(firestore, CONTENT_COLLECTION, contentId));
      if (!contentDoc.exists()) {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'content_not_published',
        };
      }
      
      const contentData = contentDoc.data();
      
      // Check if content belongs to this creator
      if (contentData.creatorId !== userId) {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'not_creator',
        };
      }
      
      // Check if content is published
      if (contentData.status !== 'published') {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'content_not_published',
        };
      }
      
      // Check if already boosted
      if (contentData.isBoosted && !isBoostExpired(contentData.boostExpiresAt?.toDate())) {
        return {
          canBoost: false,
          maxLevel: contentData.boostLevel || 1,
          availableDurations: [],
          reason: 'already_boosted',
        };
      }
      
      // Check tier eligibility
      const maxLevel = TIER_MAX_BOOST_LEVEL[userTier] || 0;
      const availableDurations = TIER_BOOST_DURATIONS[userTier] || [];
      
      if (maxLevel === 0 || availableDurations.length === 0) {
        return {
          canBoost: false,
          maxLevel: 1,
          availableDurations: [],
          reason: 'insufficient_tier',
          /**
           * FUTURE PAYMENT INTEGRATION:
           * Add: canPurchaseHigherLevel: true
           * Add: availablePaidOptions: getBoostPricing()
           */
        };
      }
      
      return {
        canBoost: true,
        maxLevel,
        availableDurations,
        /**
         * FUTURE: Add remaining free boosts count
         * remainingFreeBoosts: await getRemainingFreeBoosts(userId)
         */
      };
    } catch (error) {
      console.error('Error checking boost eligibility:', error);
      return {
        canBoost: false,
        maxLevel: 1,
        availableDurations: [],
        reason: 'not_creator',
      };
    }
  },

  /**
   * Boost content for higher visibility in feeds.
   * 
   * @param request - Boost request data
   * @param userId - User requesting the boost
   * @returns Boost result
   * 
   * FUTURE PAYMENT INTEGRATION:
   * ```typescript
   * // Add payment parameter
   * async boostContent(
   *   request: BoostContentRequest,
   *   userId: string,
   *   paymentToken?: string  // Optional for free tier boosts
   * ): Promise<BoostContentResult>
   * ```
   */
  boostContent: async (
    request: BoostContentRequest,
    userId: string
  ): Promise<BoostContentResult> => {
    // PHASE 3B: Return error if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, cannot boost content');
      return {
        success: false,
        error: 'Firebase not initialized. Please check your configuration.',
        level: 1,
      };
    }

    const { contentId, level = 1, duration = '24h' } = request;
    
    try {
      // Verify eligibility
      const eligibility = await boostService.checkBoostEligibility(userId, contentId);
      
      if (!eligibility.canBoost) {
        return {
          success: false,
          error: eligibility.reason || 'Cannot boost this content',
          level: 1,
        };
      }
      
      // Validate requested level against eligibility
      const effectiveLevel = Math.min(level, eligibility.maxLevel) as BoostLevel;
      
      // Validate duration
      const effectiveDuration = eligibility.availableDurations.includes(duration)
        ? duration
        : eligibility.availableDurations[0];
      
      // Calculate expiration
      const expiresAt = calculateExpiresAt(effectiveDuration);
      
      /**
       * FUTURE PAYMENT INTEGRATION:
       * If level > eligibility.maxLevel, require payment:
       * ```
       * if (level > eligibility.maxLevel && !paymentToken) {
       *   return { success: false, error: 'Payment required for this boost level' };
       * }
       * if (paymentToken) {
       *   const payment = await processBoostPayment(paymentToken, level, duration);
       *   if (!payment.success) {
       *     return { success: false, error: payment.error };
       *   }
       * }
       * ```
       */
      
      // Apply boost
      const updateData: Record<string, any> = {
        isBoosted: true,
        boostLevel: effectiveLevel,
        boostedAt: serverTimestamp(),
        boostedBy: 'creator',
        boostExpiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(firestore, CONTENT_COLLECTION, contentId), updateData);
      
      /**
       * FUTURE: Log boost usage for free tier tracking
       * await logBoostUsage(userId, contentId, effectiveLevel, effectiveDuration);
       */
      
      return {
        success: true,
        level: effectiveLevel,
        expiresAt: expiresAt || undefined,
      };
    } catch (error: any) {
      console.error('Error boosting content:', error);
      return {
        success: false,
        error: error.message || 'Failed to boost content',
        level: 1,
      };
    }
  },

  /**
   * Remove boost from content.
   * Can be called by content owner or admin.
   * 
   * @param contentId - Content ID to remove boost from
   * @param userId - User requesting removal
   * @param isAdmin - Whether user is admin (bypasses ownership check)
   */
  removeBoost: async (
    contentId: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    // PHASE 3B: Return error if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, cannot remove boost');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const contentDoc = await getDoc(doc(firestore, CONTENT_COLLECTION, contentId));
      
      if (!contentDoc.exists()) {
        return { success: false, error: 'Content not found' };
      }
      
      const contentData = contentDoc.data();
      
      // Verify ownership unless admin
      if (!isAdmin && contentData.creatorId !== userId) {
        return { success: false, error: 'You can only remove boost from your own content' };
      }
      
      // Check if boosted
      if (!contentData.isBoosted) {
        return { success: false, error: 'Content is not boosted' };
      }
      
      // Remove boost
      const updateData: Record<string, any> = {
        isBoosted: false,
        boostLevel: 0,
        boostedAt: null,
        boostedBy: null,
        boostExpiresAt: null,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(firestore, CONTENT_COLLECTION, contentId), updateData);
      
      /**
       * FUTURE PAYMENT INTEGRATION:
       * - Check if boost was paid
       * - Potentially issue partial refund for unused time
       * - Log removal for analytics
       */
      
      return { success: true };
    } catch (error: any) {
      console.error('Error removing boost:', error);
      return { success: false, error: error.message || 'Failed to remove boost' };
    }
  },

  /**
   * Admin: Force boost any content.
   * 
   * @param contentId - Content ID to boost
   * @param adminId - Admin user ID
   * @param level - Boost level (1-5)
   * @param duration - Boost duration
   */
  adminForceBoost: async (
    contentId: string,
    adminId: string,
    level: BoostLevel = 4,
    duration: BoostDuration = 'unlimited'
  ): Promise<BoostContentResult> => {
    try {
      // Verify admin role
      const adminDoc = await getDoc(doc(firestore, USERS_COLLECTION, adminId));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        return { success: false, error: 'Admin access required', level: 1 };
      }
      
      // Verify content exists
      const contentDoc = await getDoc(doc(firestore, CONTENT_COLLECTION, contentId));
      if (!contentDoc.exists()) {
        return { success: false, error: 'Content not found', level: 1 };
      }
      
      // Calculate expiration
      const expiresAt = calculateExpiresAt(duration);
      
      // Apply admin boost
      const updateData: Record<string, any> = {
        isBoosted: true,
        boostLevel: level,
        boostedAt: serverTimestamp(),
        boostedBy: 'admin',
        boostExpiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(firestore, CONTENT_COLLECTION, contentId), updateData);
      
      return {
        success: true,
        level,
        expiresAt: expiresAt || undefined,
      };
    } catch (error: any) {
      console.error('Error admin boosting content:', error);
      return {
        success: false,
        error: error.message || 'Failed to boost content',
        level: 1,
      };
    }
  },

  /**
   * Admin: Remove boost from any content.
   */
  adminRemoveBoost: async (
    contentId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Verify admin role
    const adminDoc = await getDoc(doc(firestore, USERS_COLLECTION, adminId));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }
    
    return boostService.removeBoost(contentId, adminId, true);
  },

  /**
   * Get all currently boosted content.
   * Sorted by boost level (highest first), then by boostedAt (newest first).
   * 
   * @param pageLimit - Maximum number of items
   * @returns List of boosted content
   */
  getBoostedContent: async (
    pageLimit: number = 50
  ): Promise<ContentListResponse> => {
    // PHASE 3B: Return empty list if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, returning empty boosted content');
      return { items: [], hasMore: false };
    }

    try {
      const q = query(
        collection(firestore, CONTENT_COLLECTION),
        where('isBoosted', '==', true),
        where('status', '==', 'published'),
        orderBy('boostLevel', 'desc'),
        orderBy('boostedAt', 'desc'),
        limit(pageLimit)
      );
      
      const snapshot = await getDocs(q);
      
      // Filter out expired boosts
      const items: Content[] = [];
      const expiredIds: string[] = [];
      
      snapshot.docs.forEach((doc) => {
        const content = docToContent(doc.id, doc.data());
        if (isBoostExpired(content.boostExpiresAt)) {
          expiredIds.push(doc.id);
        } else {
          items.push(content);
        }
      });
      
      // Clean up expired boosts in background
      if (expiredIds.length > 0) {
        boostService.cleanupExpiredBoosts(expiredIds).catch(console.error);
      }
      
      return {
        items,
        hasMore: items.length === pageLimit,
        lastId: items.length > 0 ? items[items.length - 1].id : undefined,
      };
    } catch (error: any) {
      // PHASE 3B: Handle permission errors gracefully (Firestore rules not set up yet)
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.log('⚠️ Firestore permissions not configured, using empty feed');
      } else if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        // Index error - provide helpful message
        console.warn('⚠️ Firestore index required. Creating index...');
        console.warn('📋 Index URL:', error.message.match(/https:\/\/[^\s]+/)?.[0] || 'Check Firebase Console');
        console.warn('💡 Run: firebase deploy --only firestore:indexes');
      } else {
        console.error('Error fetching boosted content:', error);
      }
      return { items: [], hasMore: false };
    }
  },

  /**
   * Get content feed with boosted content prioritized.
   * Returns boosted content first (sorted by level), then regular content by date.
   * 
   * @param pageLimit - Items per page
   * @param lastId - Pagination cursor
   * @returns Mixed feed with boosted content first
   * 
   * IMPLEMENTATION NOTE:
   * This uses a two-query approach:
   * 1. First fetch boosted content (limited)
   * 2. Then fetch regular content
   * 3. Merge with boosted first
   * 
   * For production at scale, consider:
   * - Using a composite index on (isBoosted, boostLevel, createdAt)
   * - Implementing server-side sorting via Cloud Functions
   * - Caching boosted content IDs
   */
  getFeedWithBoostedFirst: async (
    pageLimit: number = 20,
    lastId?: string
  ): Promise<ContentListResponse> => {
    // PHASE 3B: Return empty list if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, returning empty feed');
      return { items: [], hasMore: false };
    }

    try {
      // Calculate how many boosted vs regular items to fetch
      const boostedLimit = Math.min(5, Math.floor(pageLimit * 0.25)); // Max 25% boosted
      const regularLimit = pageLimit - boostedLimit;

      // Fetch boosted content
      const boostedResponse = await boostService.getBoostedContent(boostedLimit);
      
      // Fetch regular content
      const regularConstraints: QueryConstraint[] = [
        where('status', '==', 'published'),
        where('isBoosted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(regularLimit),
      ];
      
      if (lastId && boostedResponse.items.length === 0) {
        // Only use cursor for regular content if no boosted
        const lastDoc = await getDoc(doc(firestore, CONTENT_COLLECTION, lastId));
        if (lastDoc.exists()) {
          // startAfter would be added here
        }
      }

      const regularQuery = query(
        collection(firestore, CONTENT_COLLECTION),
        ...regularConstraints
      );
      
      const regularSnapshot = await getDocs(regularQuery);
      const regularItems = regularSnapshot.docs.map((doc) =>
        docToContent(doc.id, doc.data())
      );
      
      // Combine: boosted first, then regular
      const allItems = [...boostedResponse.items, ...regularItems];
      
      return {
        items: allItems,
        hasMore: regularItems.length === regularLimit,
        lastId: allItems.length > 0 ? allItems[allItems.length - 1].id : undefined,
      };
    } catch (error: any) {
      // PHASE 3B: Handle permission errors gracefully (Firestore rules not set up yet)
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.log('⚠️ Firestore permissions not configured, using empty feed');
      } else if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        // Index error - provide helpful message
        console.warn('⚠️ Firestore index required. Creating index...');
        console.warn('📋 Index URL:', error.message.match(/https:\/\/[^\s]+/)?.[0] || 'Check Firebase Console');
        console.warn('💡 Run: firebase deploy --only firestore:indexes');
      } else {
        console.error('Error fetching feed with boosted:', error);
      }
      return { items: [], hasMore: false };
    }
  },

  /**
   * Clean up expired boosts.
   * Called automatically when expired boosts are encountered.
   * In production, run this via Cloud Functions scheduler.
   */
  cleanupExpiredBoosts: async (expiredIds: string[]): Promise<void> => {
    // PHASE 3B: Skip cleanup if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, skipping boost cleanup');
      return;
    }

    try {
      const updatePromises = expiredIds.map((id) =>
        updateDoc(doc(firestore, CONTENT_COLLECTION, id), {
          isBoosted: false,
          boostLevel: 0,
          boostedAt: null,
          boostedBy: null,
          boostExpiresAt: null,
          updatedAt: serverTimestamp(),
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Cleaned up ${expiredIds.length} expired boosts`);
    } catch (error) {
      console.error('Error cleaning up expired boosts:', error);
    }
  },

  /**
   * Get boost statistics for a creator.
   */
  getCreatorBoostStats: async (
    creatorId: string
  ): Promise<{
    activeBoostedCount: number;
    totalBoostsUsed: number;
  }> => {
    // PHASE 3B: Return default stats if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, returning default boost stats');
      return { activeBoostedCount: 0, totalBoostsUsed: 0 };
    }

    try {
      const q = query(
        collection(firestore, CONTENT_COLLECTION),
        where('creatorId', '==', creatorId),
        where('isBoosted', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      // Count active (non-expired) boosts
      let activeBoostedCount = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!isBoostExpired(data.boostExpiresAt?.toDate())) {
          activeBoostedCount++;
        }
      });
      
      return {
        activeBoostedCount,
        totalBoostsUsed: snapshot.size, // Historical count
      };
    } catch (error) {
      console.error('Error fetching creator boost stats:', error);
      return { activeBoostedCount: 0, totalBoostsUsed: 0 };
    }
  },
};

export default boostService;

// =============================================================================
// FUTURE PAYMENT INTEGRATION NOTES
// =============================================================================

/**
 * PAYMENT INTEGRATION CHECKLIST:
 * 
 * 1. Add payment provider SDK (Stripe, RevenueCat, etc.)
 * 
 * 2. Create boost pricing configuration:
 *    - Store in Firestore: /config/boostPricing
 *    - Include: level, duration, priceInCents, stripePriceId
 * 
 * 3. Add payment methods:
 *    - purchaseBoost(contentId, level, duration, paymentToken)
 *    - validatePayment(paymentToken, expectedAmount)
 *    - processRefund(transactionId, reason)
 * 
 * 4. Create transaction logging:
 *    - Collection: /boostTransactions
 *    - Fields: contentId, creatorId, amount, level, duration, stripePaymentId, status
 * 
 * 5. Update eligibility check:
 *    - Return available paid options with pricing
 *    - Check if user has payment method on file
 * 
 * 6. Add boost usage tracking for free tier limits:
 *    - Subcollection: /users/{uid}/boostUsage
 *    - Track monthly usage, reset via Cloud Function
 * 
 * 7. Revenue sharing (if applicable):
 *    - Calculate platform fee vs creator payout
 *    - Track in /users/{uid}/earnings
 * 
 * Example Stripe integration:
 * ```typescript
 * import Stripe from 'stripe';
 * 
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
 * 
 * async function purchaseBoost(
 *   contentId: string,
 *   level: BoostLevel,
 *   duration: BoostDuration,
 *   paymentMethodId: string,
 *   customerId: string
 * ) {
 *   const price = getBoostPrice(level, duration);
 *   
 *   const paymentIntent = await stripe.paymentIntents.create({
 *     amount: price,
 *     currency: 'usd',
 *     customer: customerId,
 *     payment_method: paymentMethodId,
 *     confirm: true,
 *     metadata: { contentId, level: String(level), duration },
 *   });
 *   
 *   if (paymentIntent.status === 'succeeded') {
 *     await boostService.boostContent({ contentId, level, duration }, creatorId);
 *     await logBoostTransaction(contentId, paymentIntent.id, price);
 *   }
 *   
 *   return paymentIntent;
 * }
 * ```
 */

