/**
 * Membership Types
 * 
 * This file defines all TypeScript interfaces and types related to
 * membership tiers, feature flags, and access control.
 * 
 * ARCHITECTURE OVERVIEW:
 * - MembershipTier: The tier level (free, basic, pro)
 * - FeatureKey: Specific features that can be gated
 * - TierConfig: Configuration for each tier including features
 * - FeatureAccess: Boolean flags for what a tier can access
 * 
 * HOW IT WORKS:
 * 1. Each user has a membershipTier stored in Firestore
 * 2. Each tier has a set of feature flags (boolean access)
 * 3. Components use canAccess(featureKey) to check permissions
 * 4. Higher tiers inherit all features from lower tiers
 */

// =============================================================================
// MEMBERSHIP TIERS
// =============================================================================

/**
 * Available membership tier levels.
 * Ordered from lowest to highest privilege.
 * 
 * - free: Default tier, basic access
 * - basic: Paid tier with more features
 * - pro: Premium tier with all features
 */
export type MembershipTier = 'free' | 'basic' | 'pro';

/**
 * Numeric tier levels for comparison.
 * Higher number = higher tier = more access.
 */
export const TIER_LEVELS: Record<MembershipTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
};

// =============================================================================
// FEATURE KEYS
// =============================================================================

/**
 * All gated features in the application.
 * Each feature can be enabled/disabled per tier.
 * 
 * NAMING CONVENTION:
 * - Use descriptive, action-based names
 * - Group by feature area (content_, creator_, social_)
 * 
 * CATEGORIES:
 * - Content: Viewing and interacting with content
 * - Creator: Creating and managing content (creator role only)
 * - Social: Community features
 * - Premium: Advanced features
 */
export type FeatureKey =
  // Content Access
  | 'content_view_free'           // View free content
  | 'content_view_basic'          // View basic-tier content
  | 'content_view_premium'        // View premium/pro-tier content
  | 'content_download'            // Download content for offline
  | 'content_early_access'        // Access content before public release
  
  // Creator Features (requires creator role + tier)
  | 'creator_upload_content'      // Upload new content
  | 'creator_upload_video'        // Upload video content (higher storage)
  | 'creator_analytics_basic'     // Basic analytics dashboard
  | 'creator_analytics_advanced'  // Advanced analytics with insights
  | 'creator_boost_content'       // Boost content for visibility (basic level)
  | 'creator_boost_level_2'       // Standard boost (higher visibility)
  | 'creator_schedule_posts'      // Schedule content for future
  | 'creator_multiple_tiers'      // Create multiple subscription tiers
  
  // Social Features
  | 'social_comments'             // Comment on content
  | 'social_direct_messages'      // Send DMs to creators
  | 'social_exclusive_community'  // Access exclusive community areas
  
  // Premium Features
  | 'premium_no_ads'              // Ad-free experience
  | 'premium_priority_support'    // Priority customer support
  | 'premium_custom_profile';     // Custom profile themes/badges

// =============================================================================
// FEATURE ACCESS CONFIGURATION
// =============================================================================

/**
 * Feature access flags for a membership tier.
 * Maps each feature key to a boolean (enabled/disabled).
 */
export type FeatureAccess = {
  [key in FeatureKey]: boolean;
};

/**
 * Configuration for a single membership tier.
 */
export interface TierConfig {
  /** Unique tier identifier */
  id: MembershipTier;
  
  /** Display name for UI */
  name: string;
  
  /** Short description for UI */
  description: string;
  
  /** Price in USD (for display only, payments handled separately) */
  priceMonthly: number;
  
  /** Price in USD for annual billing */
  priceYearly: number;
  
  /** Numeric level for tier comparison */
  level: number;
  
  /** Feature access flags */
  features: FeatureAccess;
  
  /** Highlight features for marketing/UI */
  highlights: string[];
  
  /** Badge color for UI */
  badgeColor: string;
}

// =============================================================================
// USER MEMBERSHIP
// =============================================================================

/**
 * User's membership data stored in Firestore.
 * This extends the base user profile.
 */
export interface UserMembership {
  /** Current membership tier */
  membershipTier: MembershipTier;
  
  /** When the membership was last updated */
  membershipUpdatedAt?: Date;
  
  /** Membership expiry date (for paid tiers, null for free) */
  membershipExpiresAt?: Date | null;
  
  /** Whether membership is currently active */
  membershipActive: boolean;
}

// =============================================================================
// MEMBERSHIP CONTEXT
// =============================================================================

/**
 * Membership state provided by MembershipContext.
 */
export interface MembershipState {
  /** Current membership tier */
  tier: MembershipTier;
  
  /** Full tier configuration */
  tierConfig: TierConfig;
  
  /** Whether membership data is loading */
  loading: boolean;
  
  /** Check if user can access a specific feature */
  canAccess: (feature: FeatureKey) => boolean;
  
  /** Check if user's tier is at least the specified tier */
  hasMinTier: (minTier: MembershipTier) => boolean;
  
  /** Refresh membership data from server */
  refreshMembership: () => Promise<void>;
}

/**
 * Membership actions for upgrading/changing tiers.
 */
export interface MembershipActions {
  /** Upgrade to a higher tier (will integrate with payments later) */
  upgradeTier: (newTier: MembershipTier) => Promise<void>;
}

/**
 * Complete MembershipContext value.
 */
export interface MembershipContextValue extends MembershipState, MembershipActions {}

// =============================================================================
// FEATURE GATE PROPS
// =============================================================================

/**
 * Props for FeatureGate component.
 * Used to conditionally render content based on features.
 */
export interface FeatureGateProps {
  /** Feature key to check */
  feature: FeatureKey;
  
  /** Content to render if feature is accessible */
  children: React.ReactNode;
  
  /** Optional fallback if feature is not accessible */
  fallback?: React.ReactNode;
}

/**
 * Props for TierGate component.
 * Used to conditionally render content based on tier level.
 */
export interface TierGateProps {
  /** Minimum tier required */
  minTier: MembershipTier;
  
  /** Content to render if tier requirement is met */
  children: React.ReactNode;
  
  /** Optional fallback if tier requirement is not met */
  fallback?: React.ReactNode;
}

