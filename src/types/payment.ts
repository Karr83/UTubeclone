/**
 * Payment Types
 * 
 * This file defines all TypeScript interfaces and types related to
 * payment processing, subscriptions, and billing.
 * 
 * PAYMENT ARCHITECTURE:
 * =====================
 * 1. User selects tier on UpgradeScreen
 * 2. Frontend calls Cloud Function to create Stripe Checkout Session
 * 3. User completes payment on Stripe-hosted page (or in-app with Stripe SDK)
 * 4. Stripe sends webhook to Cloud Function
 * 5. Cloud Function verifies webhook and updates Firestore
 * 6. User's membershipTier is upgraded
 * 
 * SECURITY NOTES:
 * ===============
 * - NEVER store Stripe secret keys on the client
 * - ALWAYS verify webhook signatures on the server
 * - Use Stripe's idempotency keys for retry safety
 * - Store minimal payment data in Firestore (no full card numbers)
 * 
 * SUPPORTED PROVIDERS:
 * - Stripe (primary)
 * - Paystack (alternative for African markets)
 */

import { MembershipTier } from './membership';

// =============================================================================
// PAYMENT PROVIDERS
// =============================================================================

/**
 * Supported payment providers.
 * Add more as needed (e.g., 'paystack', 'razorpay', 'flutterwave')
 */
export type PaymentProvider = 'stripe' | 'paystack';

/**
 * Payment method types.
 */
export type PaymentMethodType = 'card' | 'bank_transfer' | 'mobile_money';

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

/**
 * Billing interval for subscriptions.
 */
export type BillingInterval = 'month' | 'year';

/**
 * Subscription status from Stripe.
 */
export type SubscriptionStatus =
  | 'active'           // Payment successful, subscription active
  | 'past_due'         // Payment failed, retrying
  | 'canceled'         // Subscription canceled
  | 'unpaid'           // Payment failed, not retrying
  | 'trialing'         // In trial period
  | 'incomplete'       // Initial payment pending
  | 'incomplete_expired'; // Initial payment failed

/**
 * Subscription details stored in Firestore.
 * 
 * SECURITY: This is stored in the user's document.
 * Only store non-sensitive data. Full payment details stay in Stripe.
 */
export interface UserSubscription {
  /** Stripe subscription ID */
  subscriptionId: string;
  
  /** Stripe customer ID */
  customerId: string;
  
  /** Current subscription status */
  status: SubscriptionStatus;
  
  /** Current membership tier */
  tier: MembershipTier;
  
  /** Billing interval */
  interval: BillingInterval;
  
  /** Current period start */
  currentPeriodStart: Date;
  
  /** Current period end (when next payment is due) */
  currentPeriodEnd: Date;
  
  /** Whether subscription will cancel at period end */
  cancelAtPeriodEnd: boolean;
  
  /** When the subscription was created */
  createdAt: Date;
  
  /** Last updated timestamp */
  updatedAt: Date;
  
  /** Payment provider used */
  provider: PaymentProvider;
}

// =============================================================================
// PRICE CONFIGURATION
// =============================================================================

/**
 * Price configuration for a tier.
 * Maps to Stripe Price objects.
 */
export interface TierPrice {
  /** Stripe Price ID for monthly billing */
  stripePriceIdMonthly: string;
  
  /** Stripe Price ID for yearly billing */
  stripePriceIdYearly: string;
  
  /** Monthly price in cents (for display) */
  monthlyPriceCents: number;
  
  /** Yearly price in cents (for display) */
  yearlyPriceCents: number;
  
  /** Currency code */
  currency: string;
}

/**
 * Complete pricing configuration.
 * Store this in Firestore /config/pricing for dynamic updates.
 */
export interface PricingConfig {
  /** Prices by tier */
  tiers: Record<MembershipTier, TierPrice | null>;
  
  /** Default currency */
  defaultCurrency: string;
  
  /** Whether trial is available */
  trialEnabled: boolean;
  
  /** Trial duration in days */
  trialDays: number;
}

// =============================================================================
// CHECKOUT TYPES
// =============================================================================

/**
 * Request to create a checkout session.
 * Sent from frontend to Cloud Function.
 */
export interface CreateCheckoutRequest {
  /** Tier to subscribe to */
  tier: MembershipTier;
  
  /** Billing interval */
  interval: BillingInterval;
  
  /** Success URL (where to redirect after payment) */
  successUrl: string;
  
  /** Cancel URL (where to redirect if canceled) */
  cancelUrl: string;
  
  /** Optional coupon code */
  couponCode?: string;
}

/**
 * Response from checkout session creation.
 */
export interface CreateCheckoutResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Stripe Checkout Session ID */
  sessionId?: string;
  
  /** Checkout URL (for redirect) */
  checkoutUrl?: string;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Request to create a customer portal session.
 * Used for managing existing subscriptions.
 */
export interface CreatePortalRequest {
  /** Return URL after portal session */
  returnUrl: string;
}

/**
 * Response from portal session creation.
 */
export interface CreatePortalResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Portal URL */
  portalUrl?: string;
  
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

/**
 * Relevant Stripe webhook event types.
 * These are the events we handle in our webhook function.
 */
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';

/**
 * Webhook payload data extracted from Stripe event.
 * 
 * SECURITY: This is processed server-side only.
 * Webhook signature must be verified before processing.
 */
export interface WebhookPayload {
  /** Event type */
  type: StripeWebhookEvent;
  
  /** Stripe customer ID */
  customerId: string;
  
  /** User ID from metadata */
  userId: string;
  
  /** Subscription ID (if applicable) */
  subscriptionId?: string;
  
  /** New tier (from metadata) */
  tier?: MembershipTier;
  
  /** Subscription status */
  status?: SubscriptionStatus;
  
  /** Current period end */
  currentPeriodEnd?: Date;
}

// =============================================================================
// PAYMENT HISTORY
// =============================================================================

/**
 * Payment record for history/receipts.
 * Stored in /users/{uid}/payments subcollection.
 */
export interface PaymentRecord {
  /** Unique payment ID */
  id: string;
  
  /** Stripe Payment Intent ID */
  stripePaymentIntentId: string;
  
  /** Amount in cents */
  amountCents: number;
  
  /** Currency */
  currency: string;
  
  /** Payment status */
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  
  /** What was purchased */
  description: string;
  
  /** Associated tier (if subscription payment) */
  tier?: MembershipTier;
  
  /** Receipt URL from Stripe */
  receiptUrl?: string;
  
  /** When payment was made */
  createdAt: Date;
}

// =============================================================================
// FRONTEND TYPES
// =============================================================================

/**
 * Payment state for UI.
 */
export interface PaymentState {
  /** Whether a payment operation is in progress */
  isLoading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Current user subscription (if any) */
  subscription: UserSubscription | null;
  
  /** Whether user has an active paid subscription */
  isPaidMember: boolean;
}

/**
 * Payment context value.
 */
export interface PaymentContextValue extends PaymentState {
  /** Create checkout session for upgrade */
  createCheckout: (tier: MembershipTier, interval: BillingInterval) => Promise<CreateCheckoutResponse>;
  
  /** Open customer portal for subscription management */
  openPortal: () => Promise<CreatePortalResponse>;
  
  /** Cancel subscription */
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  
  /** Refresh subscription status */
  refreshSubscription: () => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Stripe publishable key.
 * 
 * SECURITY: This is safe to expose on the client.
 * It can only be used to create tokens, not charge cards.
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Cloud Function URLs.
 * Replace with your actual Firebase/Cloud Function URLs.
 */
export const PAYMENT_ENDPOINTS = {
  createCheckout: '/api/payments/create-checkout',
  createPortal: '/api/payments/create-portal',
  cancelSubscription: '/api/payments/cancel-subscription',
  webhook: '/api/payments/webhook',
} as const;

