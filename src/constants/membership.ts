/**
 * Membership Constants
 * 
 * This file defines the configuration for all membership tiers.
 * Each tier specifies which features are enabled and at what level.
 * 
 * HOW TIERS WORK:
 * - Free: Basic access, limited features
 * - Basic: More features, suitable for regular users
 * - Pro: All features, premium experience
 * 
 * FEATURE INHERITANCE:
 * Higher tiers generally include all features of lower tiers.
 * Example: Pro includes everything in Basic + Free.
 * 
 * ADDING NEW FEATURES:
 * 1. Add the feature key to FeatureKey type in types/membership.ts
 * 2. Add the feature to each tier's features object below
 * 3. Use canAccess('feature_key') in components
 * 
 * FUTURE PAYMENTS:
 * The priceMonthly and priceYearly fields are display-only.
 * When integrating Stripe/payments, these will be synced with
 * actual product prices from your payment provider.
 */

import { 
  MembershipTier, 
  TierConfig, 
  FeatureAccess,
  TIER_LEVELS,
} from '../types/membership';

// =============================================================================
// DEFAULT TIER
// =============================================================================

/**
 * Default membership tier for new users.
 * Set during signup in auth service.
 */
export const DEFAULT_MEMBERSHIP_TIER: MembershipTier = 'free';

// =============================================================================
// FEATURE ACCESS BY TIER
// =============================================================================

/**
 * Feature access configuration for FREE tier.
 * This is the baseline - most restrictive access.
 */
const FREE_FEATURES: FeatureAccess = {
  // Content Access
  content_view_free: true,            // ✅ Can view free content
  content_view_basic: false,          // ❌ Cannot view basic-tier content
  content_view_premium: false,        // ❌ Cannot view premium content
  content_download: false,            // ❌ Cannot download content
  content_early_access: false,        // ❌ No early access
  
  // Creator Features
  creator_upload_content: true,       // ✅ Can upload (if creator role)
  creator_upload_video: false,        // ❌ Limited to images/text
  creator_analytics_basic: true,      // ✅ Basic analytics
  creator_analytics_advanced: false,  // ❌ No advanced analytics
  creator_boost_content: false,       // ❌ Cannot boost (upgrade required)
  creator_boost_level_2: false,       // ❌ Cannot use level 2 boost
  creator_schedule_posts: false,      // ❌ Cannot schedule
  creator_multiple_tiers: false,      // ❌ Single tier only
  
  // Social Features
  social_comments: true,              // ✅ Can comment
  social_direct_messages: false,      // ❌ No DMs
  social_exclusive_community: false,  // ❌ No exclusive community
  
  // Premium Features
  premium_no_ads: false,              // ❌ Will see ads
  premium_priority_support: false,    // ❌ Standard support
  premium_custom_profile: false,      // ❌ Standard profile
};

/**
 * Feature access configuration for BASIC tier.
 * Middle tier with most common features.
 */
const BASIC_FEATURES: FeatureAccess = {
  // Content Access
  content_view_free: true,            // ✅ All free content
  content_view_basic: true,           // ✅ Basic-tier content
  content_view_premium: false,        // ❌ Cannot view premium
  content_download: true,             // ✅ Can download
  content_early_access: false,        // ❌ No early access
  
  // Creator Features
  creator_upload_content: true,       // ✅ Can upload
  creator_upload_video: true,         // ✅ Can upload videos
  creator_analytics_basic: true,      // ✅ Basic analytics
  creator_analytics_advanced: false,  // ❌ No advanced analytics
  creator_boost_content: true,        // ✅ Level 1 boost (24h)
  creator_boost_level_2: false,       // ❌ Cannot use level 2 boost (Pro only)
  creator_schedule_posts: true,       // ✅ Can schedule
  creator_multiple_tiers: false,      // ❌ Single tier only
  
  // Social Features
  social_comments: true,              // ✅ Can comment
  social_direct_messages: true,       // ✅ Can DM
  social_exclusive_community: false,  // ❌ No exclusive community
  
  // Premium Features
  premium_no_ads: true,               // ✅ Ad-free
  premium_priority_support: false,    // ❌ Standard support
  premium_custom_profile: false,      // ❌ Standard profile
};

/**
 * Feature access configuration for PRO tier.
 * Top tier with all features enabled.
 */
const PRO_FEATURES: FeatureAccess = {
  // Content Access
  content_view_free: true,            // ✅ All free content
  content_view_basic: true,           // ✅ All basic content
  content_view_premium: true,         // ✅ All premium content
  content_download: true,             // ✅ Can download
  content_early_access: true,         // ✅ Early access
  
  // Creator Features
  creator_upload_content: true,       // ✅ Can upload
  creator_upload_video: true,         // ✅ Can upload videos
  creator_analytics_basic: true,      // ✅ Basic analytics
  creator_analytics_advanced: true,   // ✅ Advanced analytics
  creator_boost_content: true,        // ✅ Level 1 boost
  creator_boost_level_2: true,        // ✅ Level 2 boost (48h, higher priority)
  creator_schedule_posts: true,       // ✅ Can schedule
  creator_multiple_tiers: true,       // ✅ Multiple tiers
  
  // Social Features
  social_comments: true,              // ✅ Can comment
  social_direct_messages: true,       // ✅ Can DM
  social_exclusive_community: true,   // ✅ Exclusive community
  
  // Premium Features
  premium_no_ads: true,               // ✅ Ad-free
  premium_priority_support: true,     // ✅ Priority support
  premium_custom_profile: true,       // ✅ Custom profile
};

// =============================================================================
// TIER CONFIGURATIONS
// =============================================================================

/**
 * Complete configuration for all membership tiers.
 * This is the single source of truth for tier definitions.
 */
export const MEMBERSHIP_TIERS: Record<MembershipTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic access',
    priceMonthly: 0,
    priceYearly: 0,
    level: TIER_LEVELS.free,
    features: FREE_FEATURES,
    highlights: [
      'View free content',
      'Basic creator tools',
      'Comment on posts',
      'Community access',
    ],
    badgeColor: '#6B7280', // Gray
  },
  
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Enhanced access for serious users',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    level: TIER_LEVELS.basic,
    features: BASIC_FEATURES,
    highlights: [
      'Everything in Free',
      'Access basic-tier content',
      'Download for offline',
      'Direct messages',
      'Ad-free experience',
      'Video uploads (creators)',
      'Content scheduling',
    ],
    badgeColor: '#6366F1', // Indigo
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Ultimate access with all features',
    priceMonthly: 24.99,
    priceYearly: 249.99,
    level: TIER_LEVELS.pro,
    features: PRO_FEATURES,
    highlights: [
      'Everything in Basic',
      'Access ALL premium content',
      'Early access to new content',
      'Exclusive community',
      'Priority support',
      'Custom profile themes',
      'Advanced analytics (creators)',
      'Multiple subscription tiers',
    ],
    badgeColor: '#F59E0B', // Amber/Gold
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tier configuration by tier ID.
 * Falls back to free tier if invalid.
 */
export function getTierConfig(tier: MembershipTier): TierConfig {
  return MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS.free;
}

/**
 * Get all tiers as an array, sorted by level (low to high).
 */
export function getAllTiers(): TierConfig[] {
  return Object.values(MEMBERSHIP_TIERS).sort((a, b) => a.level - b.level);
}

/**
 * Check if tier A is higher than or equal to tier B.
 */
export function isTierAtLeast(
  currentTier: MembershipTier, 
  requiredTier: MembershipTier
): boolean {
  return TIER_LEVELS[currentTier] >= TIER_LEVELS[requiredTier];
}

/**
 * Get the next tier upgrade option.
 * Returns null if already at highest tier.
 */
export function getNextTier(currentTier: MembershipTier): TierConfig | null {
  const currentLevel = TIER_LEVELS[currentTier];
  const allTiers = getAllTiers();
  return allTiers.find(tier => tier.level > currentLevel) || null;
}

/**
 * Calculate yearly savings as a percentage.
 */
export function getYearlySavingsPercent(tier: MembershipTier): number {
  const config = getTierConfig(tier);
  if (config.priceMonthly === 0) return 0;
  
  const monthlyTotal = config.priceMonthly * 12;
  const savings = monthlyTotal - config.priceYearly;
  return Math.round((savings / monthlyTotal) * 100);
}

