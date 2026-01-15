# Environment Variables Setup

Create a `.env` file in the project root with these variables:

## Firebase Configuration
Get these from Firebase Console > Project Settings > General > Your apps

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Stripe Configuration (Client-side)
Get from Stripe Dashboard > Developers > API Keys

**SECURITY**: This publishable key is safe to expose on the client.

```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## Stripe Configuration (Server-side)
These are set via Firebase Functions config, NOT in .env file.

Run these commands in terminal:

```bash
firebase functions:config:set stripe.secret="sk_test_your_secret_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"
```

**⚠️ SECURITY: NEVER expose secret keys on the client or commit them to git!**

