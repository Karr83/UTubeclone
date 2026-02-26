"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.livepeerRecordingWebhook = exports.livepeerWebhook = exports.stripeWebhook = exports.deleteLivepeerAsset = exports.createRecordingOnStreamEnd = exports.createLivepeerStreamWithRecording = exports.getLivepeerStreamStatus = exports.deleteLivepeerStream = exports.createLivepeerStream = exports.cancelSubscription = exports.createPortalSession = exports.createCheckoutSession = void 0;
// Export payment functions (callable)
var payments_1 = require("./payments");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return payments_1.createCheckoutSession; } });
Object.defineProperty(exports, "createPortalSession", { enumerable: true, get: function () { return payments_1.createPortalSession; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return payments_1.cancelSubscription; } });
// Export streaming functions (callable)
var streaming_1 = require("./streaming");
Object.defineProperty(exports, "createLivepeerStream", { enumerable: true, get: function () { return streaming_1.createLivepeerStream; } });
Object.defineProperty(exports, "deleteLivepeerStream", { enumerable: true, get: function () { return streaming_1.deleteLivepeerStream; } });
Object.defineProperty(exports, "getLivepeerStreamStatus", { enumerable: true, get: function () { return streaming_1.getLivepeerStreamStatus; } });
// Export recording functions (callable)
var recording_1 = require("./recording");
Object.defineProperty(exports, "createLivepeerStreamWithRecording", { enumerable: true, get: function () { return recording_1.createLivepeerStreamWithRecording; } });
Object.defineProperty(exports, "createRecordingOnStreamEnd", { enumerable: true, get: function () { return recording_1.createRecordingOnStreamEnd; } });
Object.defineProperty(exports, "deleteLivepeerAsset", { enumerable: true, get: function () { return recording_1.deleteLivepeerAsset; } });
// =============================================================================
// WEBHOOK FUNCTIONS
// =============================================================================
var payments_2 = require("./payments");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return payments_2.stripeWebhook; } });
var streaming_2 = require("./streaming");
Object.defineProperty(exports, "livepeerWebhook", { enumerable: true, get: function () { return streaming_2.livepeerWebhook; } });
var recording_2 = require("./recording");
Object.defineProperty(exports, "livepeerRecordingWebhook", { enumerable: true, get: function () { return recording_2.livepeerRecordingWebhook; } });
// FUTURE: Export other functions here
// export { sendNotification } from './notifications';
// export { generateAnalytics } from './analytics';
//# sourceMappingURL=index.js.map