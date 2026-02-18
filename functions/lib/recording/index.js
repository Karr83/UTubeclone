"use strict";
/**
 * Recording Cloud Functions
 *
 * These functions handle the recording lifecycle:
 * - Creating recording records when streams go live
 * - Processing Livepeer webhooks when recordings are ready
 * - Managing recording assets
 *
 * LIVEPEER RECORDING SETUP:
 * =========================
 * 1. Enable recording in Livepeer stream settings
 * 2. Configure webhook for asset.ready event
 * 3. Recording automatically starts when stream goes live
 * 4. When stream ends, Livepeer processes the recording
 * 5. asset.ready webhook fires when playback URL is available
 *
 * WEBHOOK ENDPOINT:
 * https://REGION-PROJECT.cloudfunctions.net/livepeerRecordingWebhook
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLivepeerAsset = exports.createRecordingOnStreamEnd = exports.livepeerRecordingWebhook = exports.createLivepeerStreamWithRecording = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// =============================================================================
// LIVEPEER CONFIGURATION
// =============================================================================
const LIVEPEER_CONFIG = {
    apiKey: process.env.LIVEPEER_API_KEY || '',
    apiBaseUrl: 'https://livepeer.studio/api',
    playbackBaseUrl: 'https://livepeercdn.studio/hls',
};
// =============================================================================
// CREATE STREAM WITH RECORDING
// =============================================================================
/**
 * Create a stream on Livepeer with recording enabled.
 *
 * This is an enhanced version of createLivepeerStream that enables recording.
 */
exports.createLivepeerStreamWithRecording = functions.https.onCall(async (data, context) => {
    // SECURITY: Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to create a stream.');
    }
    const userId = context.auth.uid;
    const { title, creatorId } = data;
    // Validate creator ID
    if (creatorId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'You can only create streams for yourself.');
    }
    // Validate user is a creator
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'creator') {
        throw new functions.https.HttpsError('permission-denied', 'Only creators can create streams.');
    }
    try {
        // Create stream with recording enabled
        const response = await fetch(`${LIVEPEER_CONFIG.apiBaseUrl}/stream`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LIVEPEER_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: title,
                // Enable recording
                record: true,
                // Transcoding profiles
                profiles: [
                    {
                        name: '720p',
                        bitrate: 2000000,
                        fps: 30,
                        width: 1280,
                        height: 720,
                    },
                    {
                        name: '480p',
                        bitrate: 1000000,
                        fps: 30,
                        width: 854,
                        height: 480,
                    },
                    {
                        name: '360p',
                        bitrate: 500000,
                        fps: 30,
                        width: 640,
                        height: 360,
                    },
                ],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('[createLivepeerStreamWithRecording] API error:', error);
            throw new Error('Failed to create stream');
        }
        const stream = await response.json();
        return {
            streamId: stream.id,
            streamKey: stream.streamKey,
            rtmpUrl: `rtmp://rtmp.livepeer.com/live/${stream.streamKey}`,
            playbackUrl: `${LIVEPEER_CONFIG.playbackBaseUrl}/${stream.playbackId}/index.m3u8`,
            playbackId: stream.playbackId,
            recordingEnabled: true,
        };
    }
    catch (error) {
        console.error('[createLivepeerStreamWithRecording] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create stream.');
    }
});
// =============================================================================
// RECORDING WEBHOOK HANDLER
// =============================================================================
/**
 * Handle Livepeer webhooks for recording events.
 *
 * WEBHOOK SETUP:
 * 1. Go to Livepeer Studio → Developers → Webhooks
 * 2. Add endpoint: https://REGION-PROJECT.cloudfunctions.net/livepeerRecordingWebhook
 * 3. Select events: asset.ready, asset.failed
 *
 * When a stream ends, Livepeer creates an "asset" from the recording.
 * The asset.ready event fires when the recording is processed and ready.
 */
exports.livepeerRecordingWebhook = functions.https.onRequest(async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    try {
        const webhook = req.body;
        console.log('[livepeerRecordingWebhook] Received event:', webhook.event);
        switch (webhook.event) {
            case 'asset.ready':
                await handleAssetReady(webhook);
                break;
            case 'asset.failed':
                await handleAssetFailed(webhook);
                break;
            default:
                console.log('[livepeerRecordingWebhook] Unhandled event:', webhook.event);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('[livepeerRecordingWebhook] Error:', error);
        res.status(200).json({ received: true, error: error.message });
    }
});
/**
 * Handle asset.ready event.
 * Recording is processed and ready for playback.
 */
async function handleAssetReady(webhook) {
    var _a, _b, _c, _d, _e, _f;
    const asset = webhook.asset;
    console.log('[handleAssetReady] Asset ready:', asset.id, asset.name);
    // Find the recording by provider asset ID or session ID
    // First try to find by source session ID (links to the stream)
    const sourceSessionId = (_a = asset.source) === null || _a === void 0 ? void 0 : _a.sessionId;
    let recordingDoc = null;
    if (sourceSessionId) {
        // Try to find stream by provider stream ID
        const streamsQuery = await db
            .collection('streams')
            .where('providerStreamId', '==', sourceSessionId)
            .limit(1)
            .get();
        if (!streamsQuery.empty) {
            const streamId = streamsQuery.docs[0].id;
            // Find or create recording for this stream
            const recordingsQuery = await db
                .collection('recordings')
                .where('streamId', '==', streamId)
                .limit(1)
                .get();
            if (!recordingsQuery.empty) {
                recordingDoc = recordingsQuery.docs[0];
            }
        }
    }
    // Also try to find by asset name (often matches stream title)
    if (!recordingDoc) {
        const recordingsQuery = await db
            .collection('recordings')
            .where('providerAssetId', '==', asset.id)
            .limit(1)
            .get();
        if (!recordingsQuery.empty) {
            recordingDoc = recordingsQuery.docs[0];
        }
    }
    // If we still don't have a recording, try to find processing recordings
    if (!recordingDoc) {
        const processingQuery = await db
            .collection('recordings')
            .where('status', '==', 'processing')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        // Find one that matches by title
        for (const doc of processingQuery.docs) {
            const data = doc.data();
            if (data.title === asset.name) {
                recordingDoc = doc;
                break;
            }
        }
    }
    if (!recordingDoc) {
        console.warn('[handleAssetReady] No matching recording found for asset:', asset.id);
        // Create a new recording document
        // This handles cases where the recording wasn't pre-created
        const newRecordingId = `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        await db.collection('recordings').doc(newRecordingId).set({
            id: newRecordingId,
            streamId: ((_b = asset.source) === null || _b === void 0 ? void 0 : _b.sessionId) || 'unknown',
            creatorId: 'unknown', // Will need to be updated
            creatorName: 'Unknown',
            title: asset.name || 'Recorded Stream',
            status: 'ready',
            visibility: 'public',
            playbackUrl: asset.playbackUrl,
            downloadUrl: asset.downloadUrl || null,
            providerAssetId: asset.id,
            providerPlaybackId: asset.playbackId,
            durationSeconds: ((_c = asset.videoSpec) === null || _c === void 0 ? void 0 : _c.duration) || 0,
            fileSizeBytes: asset.size || null,
            resolution: getResolution((_d = asset.videoSpec) === null || _d === void 0 ? void 0 : _d.tracks),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            readyAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            viewCount: 0,
            uniqueViewers: 0,
            peakLiveViewers: 0,
            isDeleted: false,
            isHidden: false,
        });
        console.log('[handleAssetReady] Created new recording:', newRecordingId);
        return;
    }
    // Update existing recording
    await recordingDoc.ref.update({
        status: 'ready',
        playbackUrl: asset.playbackUrl,
        downloadUrl: asset.downloadUrl || null,
        providerAssetId: asset.id,
        providerPlaybackId: asset.playbackId,
        durationSeconds: ((_e = asset.videoSpec) === null || _e === void 0 ? void 0 : _e.duration) || 0,
        fileSizeBytes: asset.size || null,
        resolution: getResolution((_f = asset.videoSpec) === null || _f === void 0 ? void 0 : _f.tracks),
        readyAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('[handleAssetReady] Updated recording:', recordingDoc.id);
}
/**
 * Handle asset.failed event.
 * Recording processing failed.
 */
async function handleAssetFailed(webhook) {
    const asset = webhook.asset;
    console.log('[handleAssetFailed] Asset failed:', asset.id, asset.name);
    // Find the recording
    const recordingsQuery = await db
        .collection('recordings')
        .where('providerAssetId', '==', asset.id)
        .limit(1)
        .get();
    if (recordingsQuery.empty) {
        // Try by status
        const processingQuery = await db
            .collection('recordings')
            .where('status', '==', 'processing')
            .limit(10)
            .get();
        for (const doc of processingQuery.docs) {
            const data = doc.data();
            if (data.title === asset.name) {
                await doc.ref.update({
                    status: 'failed',
                    hiddenReason: 'Recording processing failed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log('[handleAssetFailed] Marked recording as failed:', doc.id);
                return;
            }
        }
        console.warn('[handleAssetFailed] No matching recording found');
        return;
    }
    await recordingsQuery.docs[0].ref.update({
        status: 'failed',
        hiddenReason: 'Recording processing failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('[handleAssetFailed] Marked recording as failed:', recordingsQuery.docs[0].id);
}
/**
 * Helper to extract resolution from video tracks.
 */
function getResolution(tracks) {
    if (!tracks)
        return null;
    const videoTrack = tracks.find((t) => t.type === 'video');
    if (videoTrack && videoTrack.width && videoTrack.height) {
        return `${videoTrack.width}x${videoTrack.height}`;
    }
    return null;
}
// =============================================================================
// STREAM END HANDLER
// =============================================================================
/**
 * Create recording document when stream ends.
 * Called from the main livepeerWebhook when stream.idle is received.
 */
exports.createRecordingOnStreamEnd = functions.https.onCall(async (data, context) => {
    // SECURITY: Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { streamId, creatorId, creatorName, title, description, thumbnailUrl, visibility, streamStartedAt, peakViewers, providerStreamId, } = data;
    // Calculate duration
    const startedAt = new Date(streamStartedAt);
    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    // Check minimum duration
    if (durationSeconds < 60) {
        console.log('[createRecordingOnStreamEnd] Stream too short, not creating recording');
        return { success: false, reason: 'Stream too short' };
    }
    // Create recording document
    const recordingId = `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.collection('recordings').doc(recordingId).set({
        id: recordingId,
        streamId,
        creatorId,
        creatorName,
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        status: 'processing',
        visibility: visibility || 'public',
        durationSeconds,
        streamStartedAt: admin.firestore.Timestamp.fromDate(startedAt),
        streamEndedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0,
        uniqueViewers: 0,
        peakLiveViewers: peakViewers || 0,
        isDeleted: false,
        isHidden: false,
        providerStreamId,
    });
    console.log('[createRecordingOnStreamEnd] Created recording:', recordingId);
    return { success: true, recordingId };
});
// =============================================================================
// DELETE RECORDING ASSET
// =============================================================================
/**
 * Delete recording asset from Livepeer.
 * Called when a creator deletes their recording.
 */
exports.deleteLivepeerAsset = functions.https.onCall(async (data, context) => {
    // SECURITY: Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const userId = context.auth.uid;
    const { assetId, recordingId } = data;
    // Verify ownership or admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const recordingDoc = await db.collection('recordings').doc(recordingId).get();
    const recordingData = recordingDoc.data();
    if (!recordingData) {
        throw new functions.https.HttpsError('not-found', 'Recording not found');
    }
    if (recordingData.creatorId !== userId && (userData === null || userData === void 0 ? void 0 : userData.role) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'You cannot delete this recording.');
    }
    try {
        // Delete from Livepeer
        if (assetId) {
            const response = await fetch(`${LIVEPEER_CONFIG.apiBaseUrl}/asset/${assetId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${LIVEPEER_CONFIG.apiKey}`,
                },
            });
            if (!response.ok && response.status !== 404) {
                console.warn('[deleteLivepeerAsset] Failed to delete from Livepeer');
            }
        }
        // Mark as deleted in Firestore
        await recordingDoc.ref.update({
            status: 'deleted',
            isDeleted: true,
            deletedBy: userId,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        console.error('[deleteLivepeerAsset] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to delete recording.');
    }
});
//# sourceMappingURL=index.js.map