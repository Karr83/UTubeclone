/**
 * Payment Service
 * 
 * This service handles all payment-related operations on the frontend.
 * It communicates with Cloud Functions for secure payment processing.
 * 
 * SECURITY ARCHITECTURE:
 * ======================
 * 
 *   ┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
 *   │   Mobile    │       │  Cloud Function  │       │   Stripe    │
 *   │    App      │ ───▶  │   (Backend)      │ ───▶  │   API       │
 *   └─────────────┘       └─────────────────┘       └─────────────┘
 *         │                       │                        │
 *         │ 1. Request checkout   │ 2. Create session     │
 *         │    (tier, interval)   │    (with secret key)  │
 *         │                       │                        │
 *         │ ◀──────────────────── │ ◀───────────────────── │
 *         │ 3. Return session URL │ 4. Return session      │
 *         │                       │                        │
 *         │ 5. Open checkout ─────────────────────────────▶ │
 *         │                       │                        │
 *         │                       │ ◀───────────────────── │
 *         │                       │ 6. Webhook on payment  │
 *         │                       │                        │
 *         │                       │ 7. Update Firestore   │
 *         │                       │                        │
 * 
 * KEY SECURITY PRINCIPLES:
 * - Secret keys NEVER leave the server
 * - All payment operations go through Cloud Functions
 * - Webhooks verify Stripe signatures
 * - User auth tokens required for all requests
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { db, auth } from '../config/firebase';
import { MembershipTier } from '../types/membership';
import {
  UserSubscription,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  CreatePortalRequest,
  CreatePortalResponse,
  PaymentRecord,
  BillingInterval,
  TierPrice,
  PricingConfig,
  SubscriptionStatus,
} from '../types/payment';

// =============================================================================
// FIREBASE FUNCTIONS REFERENCE
// =============================================================================

const functions = getFunctions();

/**
 * Cloud Function: Create Stripe Checkout Session
 * 
 * SECURITY: This function runs on the server with the Stripe secret key.
 * The client only receives the session URL, never the secret key.
 */
const createCheckoutSessionFn = httpsCallable<CreateCheckoutRequest, CreateCheckoutResponse>(
  functions,
  'createCheckoutSession'
);

/**
 * Cloud Function: Create Stripe Customer Portal Session
 */
const createPortalSessionFn = httpsCallable<CreatePortalRequest, CreatePortalResponse>(
  functions,
  'createPortalSession'
);

/**
 * Cloud Function: Cancel Subscription
 */
const cancelSubscriptionFn = httpsCallable<void, { success: boolean; error?: string }>(
  functions,
  'cancelSubscription'
);

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

/**
 * Default pricing configuration.
 * 
 * In production, fetch this from Firestore /config/pricing
 * to allow dynamic price updates without app releases.
 * 
 * STRIPE PRICE IDS:
 * Replace these with your actual Stripe Price IDs from the Stripe Dashboard.
 * 1. Go to Stripe Dashboard → Products
 * 2. Create products for each tier
 * 3. Create monthly and yearly prices for each
 * 4. Copy the Price IDs (e.g., price_1234abc...)
 */
export const DEFAULT_PRICING: PricingConfig = {
  defaultCurrency: 'usd',
  trialEnabled: true,
  trialDays: 7,
  tiers: {
    // Free tier - no payment required
    free: null,
    
    // Basic tier
    basic: {
      stripePriceIdMonthly: 'price_basic_monthly_REPLACE_ME',
      stripePriceIdYearly: 'price_basic_yearly_REPLACE_ME',
      monthlyPriceCents: 999,   // $9.99/month
      yearlyPriceCents: 9990,   // $99.90/year (save ~17%)
      currency: 'usd',
    },
    
    // Pro tier
    pro: {
      stripePriceIdMonthly: 'price_pro_monthly_REPLACE_ME',
      stripePriceIdYearly: 'price_pro_yearly_REPLACE_ME',
      monthlyPriceCents: 1999,  // $19.99/month
      yearlyPriceCents: 19990,  // $199.90/year (save ~17%)
      currency: 'usd',
    },
    
    // Enterprise tier (contact sales, but can self-serve)
    enterprise: {
      stripePriceIdMonthly: 'price_enterprise_monthly_REPLACE_ME',
      stripePriceIdYearly: 'price_enterprise_yearly_REPLACE_ME',
      monthlyPriceCents: 4999,  // $49.99/month
      yearlyPriceCents: 49990,  // $499.90/year (save ~17%)
      currency: 'usd',
    },
  },
};

// =============================================================================
// PRICING FUNCTIONS
// =============================================================================

/**
 * Get pricing configuration.
 * Fetches from Firestore if available, falls back to defaults.
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const configRef = doc(db, 'config', 'pricing');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return configSnap.data() as PricingConfig;
    }
    
    return DEFAULT_PRICING;
  } catch (error) {
    console.warn('[PaymentService] Failed to fetch pricing config, using defaults:', error);
    return DEFAULT_PRICING;
  }
}

/**
 * Get price for a specific tier.
 */
export function getTierPrice(
  tier: MembershipTier,
  pricing: PricingConfig = DEFAULT_PRICING
): TierPrice | null {
  return pricing.tiers[tier] || null;
}

/**
 * Format price for display.
 */
export function formatPrice(cents: number, currency: string = 'usd'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Calculate yearly savings percentage.
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
  return Math.round(savings);
}

// =============================================================================
// CHECKOUT FUNCTIONS
// =============================================================================

/**
 * Create a Stripe Checkout Session for subscription.
 * 
 * FLOW:
 * 1. Client calls this function with tier and interval
 * 2. Cloud Function creates Stripe Checkout Session
 * 3. Cloud Function returns session URL
 * 4. Client opens URL in browser/WebView
 * 5. User completes payment on Stripe
 * 6. Stripe redirects to success/cancel URL
 * 7. Webhook updates Firestore (handled server-side)
 * 
 * SECURITY: User must be authenticated.
 */
export async function createCheckoutSession(
  tier: MembershipTier,
  interval: BillingInterval,
  couponCode?: string
): Promise<CreateCheckoutResponse> {
  // SECURITY: Ensure user is authenticated
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to upgrade.',
    };
  }
  
  // Validate tier
  if (tier === 'free') {
    return {
      success: false,
      error: 'Cannot create checkout for free tier.',
    };
  }
  
  try {
    // Generate return URLs
    // In production, use deep linking to return to the app
    const baseUrl = Linking.createURL('/');
    const successUrl = `${baseUrl}payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}payment-cancel`;
    
    // Call Cloud Function
    const result = await createCheckoutSessionFn({
      tier,
      interval,
      successUrl,
      cancelUrl,
      couponCode,
    });
    
    return result.data;
  } catch (error: any) {
    console.error('[PaymentService] createCheckoutSession error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session.',
    };
  }
}

/**
 * Open Stripe Checkout in browser.
 * 
 * This opens the Stripe-hosted checkout page.
 * After payment, user is redirected back to the app.
 */
export async function openCheckout(
  tier: MembershipTier,
  interval: BillingInterval,
  couponCode?: string
): Promise<{ success: boolean; error?: string }> {
  // Create checkout session
  const result = await createCheckoutSession(tier, interval, couponCode);
  
  if (!result.success || !result.checkoutUrl) {
    return {
      success: false,
      error: result.error || 'Failed to create checkout.',
    };
  }
  
  try {
    // Open checkout URL in in-app browser
    const browserResult = await WebBrowser.openBrowserAsync(result.checkoutUrl, {
      dismissButtonStyle: 'cancel',
      showTitle: true,
      enableDefaultShare: false,
    });
    
    // User closed the browser (may or may not have completed payment)
    // The webhook will handle the actual subscription update
    return {
      success: browserResult.type === 'dismiss' || browserResult.type === 'cancel',
    };
  } catch (error: any) {
    console.error('[PaymentService] openCheckout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to open checkout.',
    };
  }
}

// =============================================================================
// CUSTOMER PORTAL
// =============================================================================

/**
 * Create and open Stripe Customer Portal.
 * 
 * The portal allows users to:
 * - View billing history
 * - Update payment method
 * - Cancel subscription
 * - Change plan
 * 
 * SECURITY: User must be authenticated and have an active subscription.
 */
export async function openCustomerPortal(): Promise<CreatePortalResponse> {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: 'You must be signed in.',
    };
  }
  
  try {
    const baseUrl = Linking.createURL('/');
    const returnUrl = `${baseUrl}subscription`;
    
    const result = await createPortalSessionFn({ returnUrl });
    
    if (result.data.success && result.data.portalUrl) {
      await WebBrowser.openBrowserAsync(result.data.portalUrl, {
        dismissButtonStyle: 'done',
        showTitle: true,
      });
    }
    
    return result.data;
  } catch (error: any) {
    console.error('[PaymentService] openCustomerPortal error:', error);
    return {
      success: false,
      error: error.message || 'Failed to open customer portal.',
    };
  }
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Get current user's subscription from Firestore.
 */
export async function getCurrentSubscription(): Promise<UserSubscription | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const userData = userSnap.data();
    
    // Check if user has subscription data
    if (!userData.subscription) {
      return null;
    }
    
    const sub = userData.subscription;
    
    return {
      subscriptionId: sub.subscriptionId,
      customerId: sub.customerId,
      status: sub.status as SubscriptionStatus,
      tier: sub.tier as MembershipTier,
      interval: sub.interval as BillingInterval,
      currentPeriodStart: sub.currentPeriodStart?.toDate() || new Date(),
      currentPeriodEnd: sub.currentPeriodEnd?.toDate() || new Date(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
      createdAt: sub.createdAt?.toDate() || new Date(),
      updatedAt: sub.updatedAt?.toDate() || new Date(),
      provider: sub.provider || 'stripe',
    };
  } catch (error) {
    console.error('[PaymentService] getCurrentSubscription error:', error);
    return null;
  }
}

/**
 * Cancel the current subscription.
 * 
 * This sets cancelAtPeriodEnd = true, so the user keeps access
 * until the current billing period ends.
 * 
 * SECURITY: Handled by Cloud Function to prevent unauthorized cancellations.
 */
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: 'You must be signed in.',
    };
  }
  
  try {
    const result = await cancelSubscriptionFn();
    return result.data;
  } catch (error: any) {
    console.error('[PaymentService] cancelSubscription error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription.',
    };
  }
}

/**
 * Check if user has an active paid subscription.
 */
export async function hasActivePaidSubscription(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  
  if (!subscription) {
    return false;
  }
  
  // Active statuses
  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing'];
  
  return activeStatuses.includes(subscription.status);
}

// =============================================================================
// PAYMENT HISTORY
// =============================================================================

/**
 * Get user's payment history.
 */
export async function getPaymentHistory(
  maxRecords: number = 10
): Promise<PaymentRecord[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }
  
  try {
    const paymentsRef = collection(db, 'users', user.uid, 'payments');
    const paymentsQuery = query(
      paymentsRef,
      orderBy('createdAt', 'desc'),
      limit(maxRecords)
    );
    
    const snapshot = await getDocs(paymentsQuery);
    
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        stripePaymentIntentId: data.stripePaymentIntentId,
        amountCents: data.amountCents,
        currency: data.currency,
        status: data.status,
        description: data.description,
        tier: data.tier,
        receiptUrl: data.receiptUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('[PaymentService] getPaymentHistory error:', error);
    return [];
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get human-readable subscription status.
 */
export function getStatusDisplayText(status: SubscriptionStatus): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    trialing: 'Trial',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
  };
  
  return statusMap[status] || status;
}

/**
 * Get status color for UI.
 */
export function getStatusColor(status: SubscriptionStatus): string {
  const colorMap: Record<SubscriptionStatus, string> = {
    active: '#22c55e',      // Green
    past_due: '#f59e0b',    // Yellow
    canceled: '#6b7280',    // Gray
    unpaid: '#ef4444',      // Red
    trialing: '#3b82f6',    // Blue
    incomplete: '#f59e0b',  // Yellow
    incomplete_expired: '#ef4444', // Red
  };
  
  return colorMap[status] || '#6b7280';
}

/**
 * Check if subscription needs attention (payment issues).
 */
export function subscriptionNeedsAttention(status: SubscriptionStatus): boolean {
  return ['past_due', 'unpaid', 'incomplete'].includes(status);
}

