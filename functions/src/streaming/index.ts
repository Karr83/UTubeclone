/**
 * Streaming Cloud Functions
 * 
 * These functions handle Livepeer API interactions server-side
 * to keep API keys secure.
 * 
 * LIVEPEER SETUP:
 * ===============
 * 1. Create account at https://livepeer.studio
 * 2. Get API key from dashboard
 * 3. Set in Firebase config:
 *    firebase functions:config:set livepeer.api_key="YOUR_API_KEY"
 * 
 * API DOCUMENTATION:
 * https://docs.livepeer.org/api-reference
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

/**
 * Livepeer API configuration.
 * 
 * SECURITY: API key is stored in Firebase Functions config,
 * NEVER in source code or client-side.
 */
const LIVEPEER_CONFIG = {
  apiKey: functions.config().livepeer?.api_key || process.env.LIVEPEER_API_KEY || '',
  apiBaseUrl: 'https://livepeer.studio/api',
  rtmpBaseUrl: 'rtmp://rtmp.livepeer.com/live',
  playbackBaseUrl: 'https://livepeercdn.studio/hls',
};

// =============================================================================
// TYPES
// =============================================================================

interface CreateStreamRequest {
  title: string;
  creatorId: string;
}

interface ProviderStreamResponse {
  streamId: string;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
}

interface LivepeerStream {
  id: string;
  name: string;
  streamKey: string;
  playbackId: string;
  isActive: boolean;
  createdAt: number;
}

// =============================================================================
// CREATE STREAM
// =============================================================================

/**
 * Create a stream on Livepeer.
 * 
 * This function:
 * 1. Validates the authenticated user
 * 2. Calls Livepeer API to create stream
 * 3. Returns stream credentials to client
 */
export const createLivepeerStream = functions.https.onCall(
  async (data: CreateStreamRequest, context): Promise<ProviderStreamResponse> => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to create a stream.'
      );
    }
    
    const userId = context.auth.uid;
    const { title, creatorId } = data;
    
    // Validate creator ID matches authenticated user
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
    
    // Check if user is suspended
    if (userData.status === 'suspended') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Your account is suspended. You cannot create streams.'
      );
    }
    
    try {
      // Call Livepeer API
      const response = await fetch(`${LIVEPEER_CONFIG.apiBaseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LIVEPEER_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title,
          profiles: [
            // Transcoding profiles for adaptive bitrate
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
        console.error('[createLivepeerStream] Livepeer API error:', error);
        throw new Error('Failed to create stream on Livepeer');
      }
      
      const livepeerStream: LivepeerStream = await response.json();
      
      return {
        streamId: livepeerStream.id,
        streamKey: livepeerStream.streamKey,
        rtmpUrl: `${LIVEPEER_CONFIG.rtmpBaseUrl}/${livepeerStream.streamKey}`,
        playbackUrl: `${LIVEPEER_CONFIG.playbackBaseUrl}/${livepeerStream.playbackId}/index.m3u8`,
      };
    } catch (error: any) {
      console.error('[createLivepeerStream] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create stream.'
      );
    }
  }
);

// =============================================================================
// DELETE STREAM
// =============================================================================

interface DeleteStreamRequest {
  providerStreamId: string;
}

/**
 * Delete a stream on Livepeer.
 */
export const deleteLivepeerStream = functions.https.onCall(
  async (data: DeleteStreamRequest, context): Promise<{ success: boolean }> => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in.'
      );
    }
    
    const { providerStreamId } = data;
    
    if (!providerStreamId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Provider stream ID is required.'
      );
    }
    
    try {
      const response = await fetch(
        `${LIVEPEER_CONFIG.apiBaseUrl}/stream/${providerStreamId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${LIVEPEER_CONFIG.apiKey}`,
          },
        }
      );
      
      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        console.error('[deleteLivepeerStream] Livepeer API error:', error);
        throw new Error('Failed to delete stream');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('[deleteLivepeerStream] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to delete stream.'
      );
    }
  }
);

// =============================================================================
// GET STREAM STATUS
// =============================================================================

interface GetStreamStatusRequest {
  providerStreamId: string;
}

interface StreamStatusResponse {
  isActive: boolean;
  isHealthy: boolean;
  viewerCount: number;
}

/**
 * Get stream status from Livepeer.
 * 
 * Use this to check if a stream is actually receiving data.
 */
export const getLivepeerStreamStatus = functions.https.onCall(
  async (data: GetStreamStatusRequest, context): Promise<StreamStatusResponse> => {
    // SECURITY: Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in.'
      );
    }
    
    const { providerStreamId } = data;
    
    try {
      const response = await fetch(
        `${LIVEPEER_CONFIG.apiBaseUrl}/stream/${providerStreamId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LIVEPEER_CONFIG.apiKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get stream status');
      }
      
      const stream = await response.json();
      
      return {
        isActive: stream.isActive || false,
        isHealthy: stream.isHealthy || false,
        viewerCount: stream.viewerCount || 0,
      };
    } catch (error: any) {
      console.error('[getLivepeerStreamStatus] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to get stream status.'
      );
    }
  }
);

// =============================================================================
// LIVEPEER WEBHOOK HANDLER
// =============================================================================

/**
 * Handle Livepeer webhooks for stream events.
 * 
 * WEBHOOK SETUP:
 * 1. Go to Livepeer Studio Dashboard → Webhooks
 * 2. Add endpoint: https://REGION-PROJECT.cloudfunctions.net/livepeerWebhook
 * 3. Select events: stream.started, stream.idle
 * 
 * This automatically updates Firestore when streams go live/offline.
 */
export const livepeerWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  
  try {
    const event = req.body;
    
    console.log('[livepeerWebhook] Received event:', event.event);
    
    // Find stream by provider ID
    const streamsQuery = await db
      .collection('streams')
      .where('providerStreamId', '==', event.stream?.id)
      .limit(1)
      .get();
    
    if (streamsQuery.empty) {
      console.log('[livepeerWebhook] No matching stream found');
      res.status(200).json({ received: true });
      return;
    }
    
    const streamDoc = streamsQuery.docs[0];
    const streamRef = streamDoc.ref;
    
    switch (event.event) {
      case 'stream.started':
        // Stream went live
        await streamRef.update({
          status: 'live',
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[livepeerWebhook] Stream ${streamDoc.id} is now live`);
        break;
        
      case 'stream.idle':
        // Stream went offline
        const streamData = streamDoc.data();
        if (streamData.status === 'live') {
          await streamRef.update({
            status: 'ended',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[livepeerWebhook] Stream ${streamDoc.id} has ended`);
        }
        break;
        
      default:
        console.log(`[livepeerWebhook] Unhandled event: ${event.event}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[livepeerWebhook] Error:', error);
    res.status(200).json({ received: true, error: error.message });
  }
});

