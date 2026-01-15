# Payment Gateway Setup Guide

This guide walks you through setting up Stripe payment integration for the MS Gift Project.

## Overview

The payment system uses **Stripe Checkout** for secure, PCI-compliant payment processing. Here's how it works:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│ Cloud Function  │────▶│     Stripe      │
│  (Frontend)     │     │   (Backend)     │     │      API        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │ 1. Select tier       │ 2. Create session    │
        │                       │                       │
        │◀──────────────────────│◀──────────────────────│
        │ 3. Get checkout URL  │                       │
        │                       │                       │
        │ 4. Open Stripe page ─────────────────────────▶│
        │                       │                       │
        │                       │◀──────────────────────│
        │                       │ 5. Webhook event     │
        │                       │                       │
        │                       │ 6. Update Firestore  │
        │                       │                       │
        │◀──────────────────────│                       │
        │ 7. Tier upgraded!    │                       │
```

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete business verification (for live payments)
4. Enable test mode for development

## Step 2: Create Products in Stripe

In the Stripe Dashboard:

1. Go to **Products** → **Add Product**

2. Create **Basic Tier**:
   - Name: "Basic Membership"
   - Description: "Perfect for casual users"
   - Add Monthly Price: $9.99/month
   - Add Yearly Price: $99.90/year (save ~17%)

3. Create **Pro Tier**:
   - Name: "Pro Membership"
   - Description: "For serious creators"
   - Add Monthly Price: $19.99/month
   - Add Yearly Price: $199.90/year (save ~17%)

4. Create **Enterprise Tier**:
   - Name: "Enterprise Membership"
   - Description: "For teams and businesses"
   - Add Monthly Price: $49.99/month
   - Add Yearly Price: $499.90/year (save ~17%)

5. Copy the **Price IDs** (e.g., `price_1234abc...`) for each price

## Step 3: Update Price IDs in Code

Open `functions/src/payments/index.ts` and replace the placeholder Price IDs:

```typescript
const TIER_PRICES: Record<string, PriceMapping> = {
  basic: {
    monthly: 'price_YOUR_BASIC_MONTHLY_ID',
    yearly: 'price_YOUR_BASIC_YEARLY_ID',
  },
  pro: {
    monthly: 'price_YOUR_PRO_MONTHLY_ID',
    yearly: 'price_YOUR_PRO_YEARLY_ID',
  },
  enterprise: {
    monthly: 'price_YOUR_ENTERPRISE_MONTHLY_ID',
    yearly: 'price_YOUR_ENTERPRISE_YEARLY_ID',
  },
};
```

Also update `src/services/payment.service.ts` with the same Price IDs.

## Step 4: Set Up Firebase Functions

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Initialize Functions

```bash
cd ms-gift-project
firebase init functions
# Select TypeScript
# Install dependencies: Yes
```

### Set Stripe Secrets

```bash
# Get your Secret Key from Stripe Dashboard > Developers > API Keys
firebase functions:config:set stripe.secret="sk_test_YOUR_SECRET_KEY"

# Get your Webhook Secret (see Step 5)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

### Deploy Functions

```bash
cd functions
npm install
npm run deploy
```

## Step 5: Set Up Webhook

Webhooks are crucial - they're how Stripe tells your app when payments succeed.

### In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://REGION-PROJECT_ID.cloudfunctions.net/stripeWebhook
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Set it in Firebase:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"
   ```
8. Redeploy functions:
   ```bash
   cd functions && npm run deploy
   ```

## Step 6: Configure Customer Portal

The Customer Portal lets users manage their subscriptions.

1. Go to **Settings** → **Billing** → **Customer portal**
2. Configure:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view invoice history
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans
3. Save settings

## Step 7: Update App Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Add your Stripe publishable key:

```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

## Step 8: Test the Integration

### Test Mode (Recommended for Development)

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Any future date and any 3-digit CVC will work.

### Local Webhook Testing

Use Stripe CLI to forward webhooks to your local emulator:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5001/YOUR_PROJECT/us-central1/stripeWebhook
```

## Pricing Configuration

To update prices without releasing a new app version:

1. Create a Firestore document: `/config/pricing`
2. Structure:
   ```json
   {
     "defaultCurrency": "usd",
     "trialEnabled": true,
     "trialDays": 7,
     "tiers": {
       "free": null,
       "basic": {
         "stripePriceIdMonthly": "price_xxx",
         "stripePriceIdYearly": "price_xxx",
         "monthlyPriceCents": 999,
         "yearlyPriceCents": 9990,
         "currency": "usd"
       },
       "pro": { ... },
       "enterprise": { ... }
     }
   }
   ```

## Security Checklist

- [ ] Secret keys stored in Firebase config (not in code)
- [ ] Webhook signature verification enabled
- [ ] HTTPS only (Firebase Functions use HTTPS by default)
- [ ] No payment data stored in Firestore (only subscription status)
- [ ] User authentication required for all payment operations
- [ ] Test mode for development, live mode for production

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify webhook secret is set
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

### Payment Succeeds But Tier Not Updated

1. Check webhook is receiving events (Stripe Dashboard > Webhooks > Events)
2. Verify `userId` is in subscription metadata
3. Check Firestore security rules allow the update

### "Could not find file" Errors

Make sure to install dependencies:
```bash
# In project root
npx expo install expo-web-browser expo-linking

# In functions folder
cd functions && npm install
```

## Going Live

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Update API keys:
   ```bash
   firebase functions:config:set stripe.secret="sk_live_xxx"
   firebase functions:config:set stripe.webhook_secret="whsec_live_xxx"
   ```
3. Update `.env`:
   ```
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   ```
4. Create new webhook endpoint for live mode
5. Redeploy functions:
   ```bash
   cd functions && npm run deploy
   ```
6. Test with real (small) transactions

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Expo WebBrowser Documentation](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

