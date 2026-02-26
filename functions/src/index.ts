/**
 * Firebase Cloud Functions Entry Point
 * 
 * This file exports all Cloud Functions for the MS Gift Project.
 * 
 * DEPLOYMENT:
 * ===========
 * 1. Install dependencies: cd functions && npm install
 * 2. Build: npm run build
 * 3. Set environment variables:
 *    firebase functions:config:set stripe.secret="sk_live_xxx"
 *    firebase functions:config:set stripe.webhook_secret="whsec_xxx"
 * 4. Deploy: npm run deploy
 * 
 * LOCAL TESTING:
 * ==============
 * 1. Use Firebase emulator: npm run serve
 * 2. For webhooks, use Stripe CLI: stripe listen --forward-to localhost:5001/PROJECT_ID/REGION/stripeWebhook
 */

// Export payment functions (callable)
export {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
} from './payments';

// Export streaming functions (callable)
export {
  createLivepeerStream,
  deleteLivepeerStream,
  getLivepeerStreamStatus,
} from './streaming';

// Export recording functions (callable)
export {
  createLivepeerStreamWithRecording,
  createRecordingOnStreamEnd,
  deleteLivepeerAsset,
} from './recording';

// =============================================================================
// WEBHOOK FUNCTIONS
// =============================================================================
export { stripeWebhook } from './payments';
export { livepeerWebhook } from './streaming';
export { livepeerRecordingWebhook } from './recording';

// FUTURE: Export other functions here
// export { sendNotification } from './notifications';
// export { generateAnalytics } from './analytics';

