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

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
// TYPES
// =============================================================================

interface LivepeerAssetWebhook {
  event: string;
  asset: {
    id: string;
    name: string;
    playbackId: string;
    playbackUrl: string;
    downloadUrl?: string;
    status: {
      phase: string;
      progress?: number;
    };
    videoSpec?: {
      duration: number;
      bitrate?: number;
      tracks?: Array<{
        type: string;
        width?: number;
        height?: number;
      }>;
    };
    size?: number;
    source?: {
      type: string;
      sessionId?: string;
    };
  };
  timestamp: number;
}

// =============================================================================
// CREATE STREAM WITH RECORDING
// =============================================================================

/**
 * Create a stream on Livepeer with recording enabled.
 * 
 * This is an enhanced version of createLivepeerStream that enables recording.
 */
export const createLivepeerStreamWithRecording = functions.https.onCall(
  async (data: { title: string; creatorId: string }, context) => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to create a stream.'
      );
    }
    
    const userId = context.auth.uid;
    const { title, creatorId } = data;
    
    // Validate creator ID
    if (creatorId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only create streams for yourself.'
      );
    }
    
    // Validate user is a creator
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'creator') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only creators can create streams.'
      );
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
    } catch (error: any) {
      console.error('[createLivepeerStreamWithRecording] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create stream.'
      );
    }
  }
);

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
export const livepeerRecordingWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  
  try {
    const webhook: LivepeerAssetWebhook = req.body;
    
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
  } catch (error: any) {
    console.error('[livepeerRecordingWebhook] Error:', error);
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Handle asset.ready event.
 * Recording is processed and ready for playback.
 */
async function handleAssetReady(webhook: LivepeerAssetWebhook): Promise<void> {
  const asset = webhook.asset;
  
  console.log('[handleAssetReady] Asset ready:', asset.id, asset.name);
  
  // Find the recording by provider asset ID or session ID
  // First try to find by source session ID (links to the stream)
  const sourceSessionId = asset.source?.sessionId;
  
  let recordingDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  
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
      streamId: asset.source?.sessionId || 'unknown',
      creatorId: 'unknown', // Will need to be updated
      creatorName: 'Unknown',
      title: asset.name || 'Recorded Stream',
      status: 'ready',
      visibility: 'public',
      playbackUrl: asset.playbackUrl,
      downloadUrl: asset.downloadUrl || null,
      providerAssetId: asset.id,
      providerPlaybackId: asset.playbackId,
      durationSeconds: asset.videoSpec?.duration || 0,
      fileSizeBytes: asset.size || null,
      resolution: getResolution(asset.videoSpec?.tracks),
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
    durationSeconds: asset.videoSpec?.duration || 0,
    fileSizeBytes: asset.size || null,
    resolution: getResolution(asset.videoSpec?.tracks),
    readyAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log('[handleAssetReady] Updated recording:', recordingDoc.id);
}

/**
 * Handle asset.failed event.
 * Recording processing failed.
 */
async function handleAssetFailed(webhook: LivepeerAssetWebhook): Promise<void> {
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
function getResolution(tracks?: Array<{ type: string; width?: number; height?: number }>): string | null {
  if (!tracks) return null;
  
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
export const createRecordingOnStreamEnd = functions.https.onCall(
  async (data: {
    streamId: string;
    creatorId: string;
    creatorName: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    visibility: string;
    streamStartedAt: number;
    peakViewers: number;
    providerStreamId: string;
  }, context) => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
    }
    
    const {
      streamId,
      creatorId,
      creatorName,
      title,
      description,
      thumbnailUrl,
      visibility,
      streamStartedAt,
      peakViewers,
      providerStreamId,
    } = data;
    
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
  }
);

// =============================================================================
// DELETE RECORDING ASSET
// =============================================================================

/**
 * Delete recording asset from Livepeer.
 * Called when a creator deletes their recording.
 */
export const deleteLivepeerAsset = functions.https.onCall(
  async (data: { assetId: string; recordingId: string }, context) => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
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
    
    if (recordingData.creatorId !== userId && userData?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You cannot delete this recording.'
      );
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
    } catch (error: any) {
      console.error('[deleteLivepeerAsset] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to delete recording.'
      );
    }
  }
);

