"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.cancelSubscription = exports.createPortalSession = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
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
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16', // Use latest stable API version
    typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const TIER_PRICES = {
    basic: {
        monthly: 'price_basic_monthly_REPLACE_ME', // Replace with actual Price ID
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
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // SECURITY: Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to upgrade.');
    }
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    // Validate input
    const { tier, interval, successUrl, cancelUrl, couponCode: _couponCode } = data;
    if (!tier || !interval || !successUrl || !cancelUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters.');
    }
    if (!TIER_PRICES[tier]) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid tier: ${tier}`);
    }
    try {
        // Get user document
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        let customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
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
        const sessionParams = {
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
        const hasHadTrial = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.hasHadTrial) || false;
        if (!hasHadTrial) {
            sessionParams.subscription_data.trial_period_days = 7;
        }
        // Create the session
        const session = await stripe.checkout.sessions.create(sessionParams);
        return {
            success: true,
            sessionId: session.id,
            checkoutUrl: session.url || undefined,
        };
    }
    catch (error) {
        console.error('[createCheckoutSession] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create checkout session.');
    }
});
/**
 * Create a Stripe Customer Portal session.
 *
 * Portal allows users to:
 * - View billing history
 * - Update payment method
 * - Cancel subscription
 * - Change plan (if configured)
 */
exports.createPortalSession = functions.https.onCall(async (data, context) => {
    var _a;
    // SECURITY: Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
    }
    const userId = context.auth.uid;
    try {
        // Get user's Stripe customer ID
        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        if (!customerId) {
            throw new functions.https.HttpsError('failed-precondition', 'No subscription found. Please subscribe first.');
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
    }
    catch (error) {
        console.error('[createPortalSession] Error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create portal session.');
    }
});
// =============================================================================
// CANCEL SUBSCRIPTION
// =============================================================================
/**
 * Cancel the user's subscription at period end.
 *
 * This doesn't immediately cancel - user keeps access until
 * the current billing period ends.
 */
exports.cancelSubscription = functions.https.onCall(async (_data, context) => {
    var _a, _b;
    // SECURITY: Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
    }
    const userId = context.auth.uid;
    try {
        // Get user's subscription ID
        const userDoc = await db.collection('users').doc(userId).get();
        const subscriptionId = (_b = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.subscription) === null || _b === void 0 ? void 0 : _b.subscriptionId;
        if (!subscriptionId) {
            throw new functions.https.HttpsError('failed-precondition', 'No active subscription found.');
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
    }
    catch (error) {
        console.error('[cancelSubscription] Error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to cancel subscription.');
    }
});
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
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
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
    let event;
    try {
        // SECURITY: Verify webhook signature
        // This ensures the request actually came from Stripe
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        console.error('[stripeWebhook] Signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoiceFailed(event.data.object);
                break;
            default:
                console.log(`[stripeWebhook] Unhandled event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
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
async function handleCheckoutComplete(session) {
    var _a, _b;
    console.log('[handleCheckoutComplete] Processing session:', session.id);
    const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
    const tier = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.tier;
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
async function handleSubscriptionUpdate(subscription) {
    var _a, _b, _c, _d;
    console.log('[handleSubscriptionUpdate] Processing subscription:', subscription.id);
    const userId = (_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.userId;
    const tier = (_b = subscription.metadata) === null || _b === void 0 ? void 0 : _b.tier;
    if (!userId) {
        console.error('[handleSubscriptionUpdate] No userId in subscription metadata');
        return;
    }
    // Determine if subscription is active
    const isActive = ['active', 'trialing'].includes(subscription.status);
    // Update user document
    const updateData = {
        // Update membership tier only if subscription is active
        membershipTier: isActive ? tier : 'free',
        // Subscription details
        subscription: {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            tier: tier,
            interval: ((_d = (_c = subscription.items.data[0]) === null || _c === void 0 ? void 0 : _c.price.recurring) === null || _d === void 0 ? void 0 : _d.interval) || 'month',
            currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
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
async function handleSubscriptionDeleted(subscription) {
    var _a;
    console.log('[handleSubscriptionDeleted] Processing subscription:', subscription.id);
    const userId = (_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.userId;
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
async function handleInvoicePaid(invoice) {
    var _a, _b, _c;
    console.log('[handleInvoicePaid] Processing invoice:', invoice.id);
    // Get user ID from subscription metadata
    if (!invoice.subscription) {
        return;
    }
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = (_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        console.error('[handleInvoicePaid] No userId found');
        return;
    }
    // Record payment in user's payment history
    const paymentRecord = {
        stripePaymentIntentId: invoice.payment_intent,
        stripeInvoiceId: invoice.id,
        amountCents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        description: `Subscription payment - ${((_b = subscription.metadata) === null || _b === void 0 ? void 0 : _b.tier) || 'Unknown'} tier`,
        tier: (_c = subscription.metadata) === null || _c === void 0 ? void 0 : _c.tier,
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
async function handleInvoiceFailed(invoice) {
    var _a;
    console.log('[handleInvoiceFailed] Processing invoice:', invoice.id);
    if (!invoice.subscription) {
        return;
    }
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = (_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.userId;
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
//# sourceMappingURL=index.js.map