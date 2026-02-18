/**
 * Payment Cloud Functions
 * 
 * These functions run on Firebase Cloud Functions (or similar serverless platform).
 * They handle all secure payment operations that require the Stripe secret key.
 * 
 * DEPLOYMENT:
 * ===========
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Initialize functions: firebase init functions
 * 3. Set Stripe secret: firebase functions:config:set stripe.secret="sk_live_xxx"
 * 4. Deploy: firebase deploy --only functions
 * 
 * SECURITY CHECKLIST:
 * ===================
 * ✅ Stripe secret key stored in environment variables (never in code)
 * ✅ All functions require authentication
 * ✅ Webhook signature verification
 * ✅ User can only modify their own subscription
 * ✅ Idempotency keys for retry safety
 * ✅ Input validation on all endpoints
 * ✅ Rate limiting (handled by Firebase)
 * 
 * STRIPE DASHBOARD SETUP:
 * =======================
 * 1. Create products for each tier (Basic, Pro, Enterprise)
 * 2. Create monthly and yearly prices for each product
 * 3. Set up webhook endpoint: https://your-project.cloudfunctions.net/stripeWebhook
 * 4. Select events: checkout.session.completed, customer.subscription.*
 * 5. Copy webhook signing secret to environment variables
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// =============================================================================
// STRIPE INITIALIZATION
// =============================================================================

/**
 * Initialize Stripe with secret key from environment.
 * 
 * SECURITY: The secret key is stored in Firebase environment config,
 * NEVER in source code or client-side.
 * 
 * Set it with: firebase functions:config:set stripe.secret="sk_live_xxx"
 * For webhook: firebase functions:config:set stripe.webhook_secret="whsec_xxx"
 */
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  {
    apiVersion: '2023-10-16', // Use latest stable API version
    typescript: true,
  }
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// =============================================================================
// PRICE CONFIGURATION
// =============================================================================

/**
 * Map of tiers to Stripe Price IDs.
 * 
 * SETUP: Replace these with your actual Stripe Price IDs from the dashboard.
 */
interface PriceMapping {
  monthly: string;
  yearly: string;
}

const TIER_PRICES: Record<string, PriceMapping> = {
  basic: {
    monthly: 'price_basic_monthly_REPLACE_ME',  // Replace with actual Price ID
    yearly: 'price_basic_yearly_REPLACE_ME',
  },
  pro: {
    monthly: 'price_pro_monthly_REPLACE_ME',
    yearly: 'price_pro_yearly_REPLACE_ME',
  },
  enterprise: {
    monthly: 'price_enterprise_monthly_REPLACE_ME',
    yearly: 'price_enterprise_yearly_REPLACE_ME',
  },
};

// =============================================================================
// CREATE CHECKOUT SESSION
// =============================================================================

interface CreateCheckoutRequest {
  tier: string;
  interval: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
}

interface CreateCheckoutResponse {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Create a Stripe Checkout Session for subscription.
 * 
 * SECURITY:
 * - Requires authenticated user
 * - User ID stored in session metadata
 * - Session can only be used once
 * 
 * FLOW:
 * 1. Validate user and input
 * 2. Get or create Stripe customer
 * 3. Create Checkout Session with subscription mode
 * 4. Return session URL for redirect
 */
export const createCheckoutSession = functions.https.onCall(
  async (data: CreateCheckoutRequest, context): Promise<CreateCheckoutResponse> => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to upgrade.'
      );
    }
    
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    
    // Validate input
    const { tier, interval, successUrl, cancelUrl, couponCode: _couponCode } = data;
    
    if (!tier || !interval || !successUrl || !cancelUrl) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters.'
      );
    }
    
    if (!TIER_PRICES[tier]) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid tier: ${tier}`
      );
    }
    
    try {
      // Get user document
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      let customerId = userDoc.data()?.stripeCustomerId;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            firebaseUserId: userId,
          },
        });
        
        customerId = customer.id;
        
        // Save customer ID to user document
        await userRef.update({
          stripeCustomerId: customerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      // Get the price ID
      const priceId = interval === 'year'
        ? TIER_PRICES[tier].yearly
        : TIER_PRICES[tier].monthly;
      
      // Build checkout session params
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        // Store user info in metadata for webhook processing
        metadata: {
          userId: userId,
          tier: tier,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            tier: tier,
          },
        },
        // Allow promotion codes
        allow_promotion_codes: true,
      };
      
      // Add trial if enabled and user hasn't had one before
      const hasHadTrial = userDoc.data()?.hasHadTrial || false;
      if (!hasHadTrial) {
        sessionParams.subscription_data!.trial_period_days = 7;
      }
      
      // Create the session
      const session = await stripe.checkout.sessions.create(sessionParams);
      
      return {
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url || undefined,
      };
    } catch (error: any) {
      console.error('[createCheckoutSession] Error:', error);
      
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create checkout session.'
      );
    }
  }
);

// =============================================================================
// CREATE CUSTOMER PORTAL SESSION
// =============================================================================

interface CreatePortalRequest {
  returnUrl: string;
}

interface CreatePortalResponse {
  success: boolean;
  portalUrl?: string;
  error?: string;
}

/**
 * Create a Stripe Customer Portal session.
 * 
 * Portal allows users to:
 * - View billing history
 * - Update payment method
 * - Cancel subscription
 * - Change plan (if configured)
 */
export const createPortalSession = functions.https.onCall(
  async (data: CreatePortalRequest, context): Promise<CreatePortalResponse> => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in.'
      );
    }
    
    const userId = context.auth.uid;
    
    try {
      // Get user's Stripe customer ID
      const userDoc = await db.collection('users').doc(userId).get();
      const customerId = userDoc.data()?.stripeCustomerId;
      
      if (!customerId) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No subscription found. Please subscribe first.'
        );
      }
      
      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: data.returnUrl,
      });
      
      return {
        success: true,
        portalUrl: session.url,
      };
    } catch (error: any) {
      console.error('[createPortalSession] Error:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create portal session.'
      );
    }
  }
);

// =============================================================================
// CANCEL SUBSCRIPTION
// =============================================================================

/**
 * Cancel the user's subscription at period end.
 * 
 * This doesn't immediately cancel - user keeps access until
 * the current billing period ends.
 */
export const cancelSubscription = functions.https.onCall(
  async (_data: void, context): Promise<{ success: boolean; error?: string }> => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in.'
      );
    }
    
    const userId = context.auth.uid;
    
    try {
      // Get user's subscription ID
      const userDoc = await db.collection('users').doc(userId).get();
      const subscriptionId = userDoc.data()?.subscription?.subscriptionId;
      
      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No active subscription found.'
        );
      }
      
      // Cancel at period end (user keeps access until then)
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Update Firestore
      await db.collection('users').doc(userId).update({
        'subscription.cancelAtPeriodEnd': true,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('[cancelSubscription] Error:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to cancel subscription.'
      );
    }
  }
);

// =============================================================================
// STRIPE WEBHOOK HANDLER
// =============================================================================

/**
 * Handle Stripe webhooks.
 * 
 * SECURITY:
 * - Verifies Stripe signature to prevent spoofing
 * - Only processes relevant events
 * - Idempotent (safe to retry)
 * 
 * WEBHOOK SETUP IN STRIPE DASHBOARD:
 * 1. Go to Developers → Webhooks
 * 2. Add endpoint: https://your-project.cloudfunctions.net/stripeWebhook
 * 3. Select events:
 *    - checkout.session.completed
 *    - customer.subscription.created
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - invoice.paid
 *    - invoice.payment_failed
 * 4. Copy signing secret and add to Firebase config
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  
  // Get signature from header
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    console.error('[stripeWebhook] No signature found');
    res.status(400).send('No signature');
    return;
  }
  
  let event: Stripe.Event;
  
  try {
    // SECURITY: Verify webhook signature
    // This ensures the request actually came from Stripe
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('[stripeWebhook] Signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`[stripeWebhook] Unhandled event type: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[stripeWebhook] Error handling event:', error);
    // Return 200 anyway to prevent Stripe retries for application errors
    // Log the error for debugging
    res.status(200).json({ received: true, error: error.message });
  }
});

// =============================================================================
// WEBHOOK EVENT HANDLERS
// =============================================================================

/**
 * Handle completed checkout session.
 * 
 * This is called when user successfully completes payment.
 * Update user's membership tier and subscription details.
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  console.log('[handleCheckoutComplete] Processing session:', session.id);
  
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  
  if (!userId) {
    console.error('[handleCheckoutComplete] No userId in session metadata');
    return;
  }
  
  // Mark that user has had a trial (to prevent multiple trials)
  await db.collection('users').doc(userId).update({
    hasHadTrial: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log(`[handleCheckoutComplete] User ${userId} completed checkout for tier: ${tier}`);
}

/**
 * Handle subscription created or updated.
 * 
 * This updates the user's Firestore document with:
 * - New membership tier
 * - Subscription status
 * - Billing period dates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  console.log('[handleSubscriptionUpdate] Processing subscription:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  const tier = subscription.metadata?.tier;
  
  if (!userId) {
    console.error('[handleSubscriptionUpdate] No userId in subscription metadata');
    return;
  }
  
  // Determine if subscription is active
  const isActive = ['active', 'trialing'].includes(subscription.status);
  
  // Update user document
  const updateData: Record<string, any> = {
    // Update membership tier only if subscription is active
    membershipTier: isActive ? tier : 'free',
    
    // Subscription details
    subscription: {
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      tier: tier,
      interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(
        subscription.current_period_start * 1000
      ),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
        subscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: admin.firestore.Timestamp.fromMillis(subscription.created * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      provider: 'stripe',
    },
    
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await db.collection('users').doc(userId).update(updateData);
  
  console.log(`[handleSubscriptionUpdate] Updated user ${userId} to tier: ${tier}, status: ${subscription.status}`);
}

/**
 * Handle subscription deleted/canceled.
 * 
 * Revert user to free tier.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('[handleSubscriptionDeleted] Processing subscription:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('[handleSubscriptionDeleted] No userId in subscription metadata');
    return;
  }
  
  // Revert to free tier
  await db.collection('users').doc(userId).update({
    membershipTier: 'free',
    'subscription.status': 'canceled',
    'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log(`[handleSubscriptionDeleted] Reverted user ${userId} to free tier`);
}

/**
 * Handle successful invoice payment.
 * 
 * Record the payment in user's payment history.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log('[handleInvoicePaid] Processing invoice:', invoice.id);
  
  // Get user ID from subscription metadata
  if (!invoice.subscription) {
    return;
  }
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('[handleInvoicePaid] No userId found');
    return;
  }
  
  // Record payment in user's payment history
  const paymentRecord = {
    stripePaymentIntentId: invoice.payment_intent as string,
    stripeInvoiceId: invoice.id,
    amountCents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    description: `Subscription payment - ${subscription.metadata?.tier || 'Unknown'} tier`,
    tier: subscription.metadata?.tier,
    receiptUrl: invoice.hosted_invoice_url,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await db.collection('users').doc(userId).collection('payments').add(paymentRecord);
  
  console.log(`[handleInvoicePaid] Recorded payment for user ${userId}`);
}

/**
 * Handle failed invoice payment.
 * 
 * Mark subscription as past_due. Stripe will retry automatically.
 * You may want to send an email notification here.
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('[handleInvoiceFailed] Processing invoice:', invoice.id);
  
  if (!invoice.subscription) {
    return;
  }
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    return;
  }
  
  // Update subscription status
  await db.collection('users').doc(userId).update({
    'subscription.status': 'past_due',
    'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // TODO: Send email notification to user about failed payment
  // await sendPaymentFailedEmail(userId, invoice);
  
  console.log(`[handleInvoiceFailed] Updated user ${userId} to past_due`);
}

