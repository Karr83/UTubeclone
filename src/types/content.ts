/**
 * Content Types
 * 
 * This file defines all TypeScript interfaces and types related to
 * creator content - uploads, media, visibility, and access control.
 * 
 * CONTENT ARCHITECTURE:
 * - Creators upload media (images/videos) to Firebase Storage
 * - Content metadata is stored in Firestore /content collection
 * - Visibility controls who can view: public vs membersOnly
 * - Future: Add tier-based visibility for monetization
 * 
 * FUTURE STREAMING PREPARATION:
 * - mediaType can be extended to include "live_stream"
 * - Additional fields for stream status, viewer count, etc.
 * - Separate collection for live stream sessions
 */

// Import membership tier for future tier-gated content
// import { MembershipTier } from './membership';

// =============================================================================
// MEDIA TYPES
// =============================================================================

/**
 * Supported media types for content uploads.
 * 
 * CURRENT:
 * - image: Photos, graphics, artwork
 * - video: Recorded video content
 * 
 * FUTURE (for streaming):
 * - live_stream: Real-time video streaming
 * - audio: Podcasts, music (if needed)
 */
export type MediaType = 'image' | 'video';

/**
 * Content visibility settings.
 * 
 * - public: Anyone can view (logged in or not)
 * - membersOnly: Only subscribers/members can view
 * 
 * FUTURE (for monetization):
 * - tier_basic: Only basic+ tier members
 * - tier_pro: Only pro tier members
 * - purchaseOnly: One-time purchase required
 */
export type ContentVisibility = 'public' | 'membersOnly';

/**
 * Content status for moderation and publishing flow.
 * 
 * MODERATION WORKFLOW:
 * 1. Creator uploads → status: 'pending'
 * 2. Admin reviews:
 *    - Approve → status: 'published'
 *    - Reject → status: 'rejected'
 * 3. Published content can be removed → status: 'removed'
 */
export type ContentStatus = 
  | 'draft'       // Not yet published (saved but not submitted)
  | 'pending'     // Submitted, awaiting admin approval
  | 'processing'  // Media being processed
  | 'published'   // Approved and live
  | 'rejected'    // Rejected by admin (with reason)
  | 'archived'    // Hidden but not deleted
  | 'removed';    // Removed by admin/creator

// =============================================================================
// CONTENT DATA MODEL
// =============================================================================

/**
 * Main content document stored in Firestore.
 * This is the core data model for all creator uploads.
 */
export interface Content {
  /** Unique content identifier (Firestore document ID) */
  id: string;
  
  /** Creator's user ID who uploaded this content */
  creatorId: string;
  
  /** Content title */
  title: string;
  
  /** Content description (optional) */
  description?: string;
  
  /** Type of media (image or video) */
  mediaType: MediaType;
  
  /** Firebase Storage URL for the media file */
  mediaUrl: string;
  
  /** Thumbnail URL (auto-generated or custom) */
  thumbnailUrl?: string;
  
  /** Who can view this content */
  visibility: ContentVisibility;
  
  /** Current content status */
  status: ContentStatus;
  
  /** When the content was created */
  createdAt: Date;
  
  /** When the content was last updated */
  updatedAt?: Date;
  
  /** When the content was published (if different from created) */
  publishedAt?: Date;
  
  // ---------------------------------------------------------------------------
  // ENGAGEMENT METRICS (Updated via Cloud Functions in production)
  // ---------------------------------------------------------------------------
  
  /** Number of views */
  viewCount: number;
  
  /** Number of likes */
  likeCount: number;
  
  /** Number of comments */
  commentCount: number;
  
  // ---------------------------------------------------------------------------
  // BOOST / PROMOTION FIELDS
  // ---------------------------------------------------------------------------
  
  /**
   * Whether this content is currently boosted.
   * Boosted content appears higher in feeds.
   */
  isBoosted: boolean;
  
  /**
   * Boost priority level (1-5).
   * Higher levels appear before lower levels.
   * 
   * BOOST LEVELS:
   * - 1: Basic boost (Pro tier creators)
   * - 2: Standard boost (Pro tier + extra)
   * - 3: Premium boost (future paid feature)
   * - 4: Featured boost (admin-promoted)
   * - 5: Spotlight boost (highest priority, admin only)
   * 
   * FUTURE PAYMENT INTEGRATION:
   * - Level 1-2: Included with membership tier
   * - Level 3-5: Requires additional payment
   * - Payment flow: boostService.purchaseBoost(contentId, level, paymentToken)
   */
  boostLevel: number;
  
  /**
   * When the boost was activated.
   * Used for boost duration tracking.
   * 
   * FUTURE: Add boostExpiresAt for time-limited boosts
   */
  boostedAt?: Date;
  
  /**
   * Who boosted this content.
   * 'creator' = creator self-boost
   * 'admin' = admin-promoted
   * 
   * FUTURE PAYMENT INTEGRATION:
   * - Track payment method used
   * - Store transaction ID for refunds
   */
  boostedBy?: 'creator' | 'admin';
  
  /**
   * Boost expiration time (optional).
   * null = boost doesn't expire
   * 
   * FUTURE PAYMENT INTEGRATION:
   * - Free boosts: 24-48 hours
   * - Paid boosts: 7-30 days based on payment tier
   */
  boostExpiresAt?: Date | null;
  
  // ---------------------------------------------------------------------------
  // FUTURE: MONETIZATION FIELDS (Uncomment when implementing)
  // ---------------------------------------------------------------------------
  
  // /** Minimum tier required to view (for tier-gated content) */
  // requiredTier?: MembershipTier;
  
  // /** One-time purchase price (for purchaseOnly visibility) */
  // purchasePrice?: number;
  
  // /** Revenue generated from this content */
  // totalRevenue?: number;
  
  // /** Payment transaction ID for boost purchase */
  // boostPaymentId?: string;
  
  // /** Amount paid for boost (in cents) */
  // boostPaymentAmount?: number;
  
  // ---------------------------------------------------------------------------
  // FUTURE: STREAMING FIELDS (Uncomment when implementing)
  // ---------------------------------------------------------------------------
  
  // /** For live streams: current stream status */
  // streamStatus?: 'offline' | 'live' | 'ended';
  
  // /** For live streams: scheduled start time */
  // scheduledStartTime?: Date;
  
  // /** For live streams: actual start time */
  // actualStartTime?: Date;
  
  // /** For live streams: end time */
  // endTime?: Date;
  
  // /** For live streams: peak concurrent viewers */
  // peakViewers?: number;
}

/**
 * Data required to create new content.
 * Used when uploading content from the app.
 */
export interface CreateContentData {
  /** Content title */
  title: string;
  
  /** Content description (optional) */
  description?: string;
  
  /** Type of media being uploaded */
  mediaType: MediaType;
  
  /** Local URI of the media file to upload */
  localMediaUri: string;
  
  /** Who can view this content */
  visibility: ContentVisibility;
}

/**
 * Data for updating existing content.
 */
export interface UpdateContentData {
  /** New title (optional) */
  title?: string;
  
  /** New description (optional) */
  description?: string;
  
  /** New visibility setting (optional) */
  visibility?: ContentVisibility;
  
  /** New status (optional) */
  status?: ContentStatus;
}

// =============================================================================
// UPLOAD TYPES
// =============================================================================

/**
 * Upload progress state for tracking media uploads.
 */
export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  
  /** Bytes transferred so far */
  bytesTransferred: number;
  
  /** Total bytes to transfer */
  totalBytes: number;
  
  /** Current upload state */
  state: 'idle' | 'uploading' | 'paused' | 'success' | 'error';
  
  /** Error message if upload failed */
  error?: string;
}

/**
 * Result of a successful content upload.
 */
export interface UploadResult {
  /** The created content document */
  content: Content;
  
  /** Firebase Storage download URL */
  downloadUrl: string;
  
  /** Storage path for reference */
  storagePath: string;
}

// =============================================================================
// QUERY TYPES
// =============================================================================

/**
 * Options for querying content.
 */
export interface ContentQueryOptions {
  /** Filter by creator ID */
  creatorId?: string;
  
  /** Filter by visibility */
  visibility?: ContentVisibility;
  
  /** Filter by media type */
  mediaType?: MediaType;
  
  /** Filter by status */
  status?: ContentStatus;
  
  /** Filter by boost status */
  isBoosted?: boolean;
  
  /** Include boosted content priority sorting */
  prioritizeBoosted?: boolean;
  
  /** Maximum number of results */
  limit?: number;
  
  /** Cursor for pagination (last document ID) */
  startAfter?: string;
  
  /** Sort order */
  orderBy?: 'createdAt' | 'viewCount' | 'likeCount' | 'boostLevel';
  
  /** Sort direction */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated content response.
 */
export interface ContentListResponse {
  /** Array of content items */
  items: Content[];
  
  /** Whether there are more items to fetch */
  hasMore: boolean;
  
  /** Cursor for next page (last item ID) */
  lastId?: string;
  
  /** Total count (if available) */
  totalCount?: number;
}

// =============================================================================
// ACCESS CONTROL TYPES
// =============================================================================

/**
 * Result of checking if user can access content.
 */
export interface ContentAccessResult {
  /** Whether user can view this content */
  canView: boolean;
  
  /** Reason if access denied */
  reason?: 'not_authenticated' | 'not_member' | 'insufficient_tier' | 'content_removed';
  
  /** Required action to gain access */
  requiredAction?: 'login' | 'subscribe' | 'upgrade' | 'purchase';
  
  /** For tier-gated content: required tier */
  requiredTier?: MembershipTier;
}

// =============================================================================
// BOOST / PROMOTION TYPES
// =============================================================================

/**
 * Boost level definitions.
 * 
 * CURRENT IMPLEMENTATION:
 * - Levels 1-2: Available to Pro tier creators (free with membership)
 * - Levels 3-5: Reserved for future paid features / admin use
 * 
 * FUTURE PAYMENT INTEGRATION:
 * When payments are added, create a BoostPurchaseOptions type:
 * ```
 * interface BoostPurchaseOptions {
 *   level: BoostLevel;
 *   duration: BoostDuration;
 *   paymentMethod: 'card' | 'inAppPurchase' | 'credits';
 *   paymentToken?: string;
 * }
 * ```
 */
export type BoostLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Boost duration options.
 * 
 * FUTURE: Map these to payment tiers
 * - FREE: 24h with Pro membership
 * - PAID: 7d, 14d, 30d options with payment
 */
export type BoostDuration = '24h' | '48h' | '7d' | '14d' | '30d' | 'unlimited';

/**
 * Boost configuration per tier/level.
 * 
 * FUTURE PAYMENT INTEGRATION:
 * Add priceInCents field when implementing payments:
 * ```
 * interface BoostTierConfig {
 *   level: BoostLevel;
 *   name: string;
 *   description: string;
 *   maxDuration: BoostDuration;
 *   requiredMembershipTier?: MembershipTier;
 *   priceInCents?: number; // Add when payments implemented
 *   stripePriceId?: string; // For Stripe integration
 * }
 * ```
 */
export interface BoostTierConfig {
  /** Boost level (1-5) */
  level: BoostLevel;
  
  /** Display name for the tier */
  name: string;
  
  /** Description of benefits */
  description: string;
  
  /** Maximum duration for this tier */
  maxDuration: BoostDuration;
  
  /** Minimum membership tier required (null = payment required) */
  requiredMembershipTier?: 'free' | 'basic' | 'pro' | null;
  
  /** Whether this tier is currently available */
  isAvailable: boolean;
}

/**
 * Request to boost content.
 */
export interface BoostContentRequest {
  /** Content ID to boost */
  contentId: string;
  
  /** Requested boost level */
  level?: BoostLevel;
  
  /** Requested duration */
  duration?: BoostDuration;
  
  /**
   * FUTURE PAYMENT INTEGRATION:
   * Add payment fields when implementing:
   * 
   * paymentToken?: string;      // From payment provider
   * paymentMethod?: 'card' | 'inAppPurchase' | 'credits';
   * applyCouponCode?: string;   // For discounts
   */
}

/**
 * Result of a boost request.
 */
export interface BoostContentResult {
  /** Whether boost was successful */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Boost expiration time */
  expiresAt?: Date;
  
  /** Applied boost level */
  level: BoostLevel;
  
  /**
   * FUTURE PAYMENT INTEGRATION:
   * Add payment result fields:
   * 
   * paymentId?: string;         // Transaction ID
   * amountCharged?: number;     // In cents
   * receiptUrl?: string;        // Payment receipt
   */
}

/**
 * Boost eligibility check result.
 */
export interface BoostEligibility {
  /** Whether user can boost content */
  canBoost: boolean;
  
  /** Maximum boost level available to user */
  maxLevel: BoostLevel;
  
  /** Available durations for user's tier */
  availableDurations: BoostDuration[];
  
  /** Reason if cannot boost */
  reason?: 'not_creator' | 'insufficient_tier' | 'content_not_published' | 'already_boosted' | 'suspended';
  
  /** Remaining free boosts this period (if limited) */
  remainingFreeBoosts?: number;
  
  /**
   * FUTURE PAYMENT INTEGRATION:
   * Add payment-related eligibility:
   * 
   * canPurchaseHigherLevel?: boolean;
   * availablePaidOptions?: BoostTierConfig[];
   */
}

// =============================================================================
// CREATOR STATS
// =============================================================================

/**
 * Aggregated statistics for a creator's content.
 */
export interface CreatorContentStats {
  /** Total number of content items */
  totalContent: number;
  
  /** Total views across all content */
  totalViews: number;
  
  /** Total likes across all content */
  totalLikes: number;
  
  /** Total comments across all content */
  totalComments: number;
  
  /** Number of public content items */
  publicCount: number;
  
  /** Number of members-only content items */
  membersOnlyCount: number;
  
  /** Number of currently boosted content items */
  boostedCount: number;
}

