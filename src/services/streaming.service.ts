/**
 * Streaming Service
 * 
 * This service handles all live streaming operations with a provider-agnostic
 * abstraction layer. Currently configured for Livepeer but can be swapped.
 * 
 * ARCHITECTURE:
 * =============
 * 
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                         STREAMING SERVICE                               │
 *   ├─────────────────────────────────────────────────────────────────────────┤
 *   │                                                                         │
 *   │   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
 *   │   │   Livepeer      │     │   Mux           │     │   Custom        │  │
 *   │   │   Provider      │     │   Provider      │     │   Provider      │  │
 *   │   └────────┬────────┘     └────────┬────────┘     └────────┬────────┘  │
 *   │            │                       │                       │           │
 *   │            └───────────────────────┼───────────────────────┘           │
 *   │                                    │                                   │
 *   │                          ┌─────────▼─────────┐                         │
 *   │                          │  Provider         │                         │
 *   │                          │  Abstraction      │                         │
 *   │                          │  Layer            │                         │
 *   │                          └─────────┬─────────┘                         │
 *   │                                    │                                   │
 *   │                          ┌─────────▼─────────┐                         │
 *   │                          │  Stream           │                         │
 *   │                          │  Service          │                         │
 *   │                          │  (This File)      │                         │
 *   │                          └───────────────────┘                         │
 *   │                                                                         │
 *   └─────────────────────────────────────────────────────────────────────────┘
 * 
 * SECURITY NOTES:
 * - Stream keys are sensitive - only show to the creator
 * - Provider API calls should go through Cloud Functions in production
 * - Viewer counts can be spoofed - validate on backend for critical use
 */

/* PHASE 2: Firebase imports commented out
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
*/

// PHASE 3B: Import real Firebase functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firestore, auth } from '../config/firebase';

import {
  Stream,
  StreamKey,
  StreamStatus,
  StreamVisibility,
  StreamMode,
  CreateStreamConfig,
  UpdateStreamData,
  ProviderStreamResponse,
  OBSSetupInfo,
  StreamQueryOptions,
  StreamListResponse,
  StreamingProvider,
} from '../types/streaming';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Current streaming provider configuration.
 * 
 * LIVEPEER SETUP:
 * 1. Create account at https://livepeer.studio
 * 2. Get API key from dashboard
 * 3. Store API key in Firebase Functions config (NOT in client code)
 */
const PROVIDER_CONFIG = {
  provider: 'livepeer' as StreamingProvider,
  
  // Livepeer RTMP ingest URL
  // The stream key is appended to this URL
  rtmpBaseUrl: 'rtmp://rtmp.livepeer.com/live',
  
  // Livepeer playback base URL
  playbackBaseUrl: 'https://livepeercdn.studio/hls',
};

/**
 * Firestore collection names.
 */
const COLLECTIONS = {
  streams: 'streams',
  streamKeys: 'streamKeys',
  viewers: 'viewers',
};

// =============================================================================
// CLOUD FUNCTIONS REFERENCES
// =============================================================================

const functions = getFunctions();

/**
 * Create stream via Cloud Function (for secure API key handling).
 * 
 * In production, this calls Livepeer API server-side.
 * For development, we generate mock data client-side.
 */
const createStreamOnProvider = httpsCallable<
  { title: string; creatorId: string },
  ProviderStreamResponse
>(functions, 'createLivepeerStream');

/**
 * Delete stream on provider.
 */
const deleteStreamOnProvider = httpsCallable<
  { providerStreamId: string },
  { success: boolean }
>(functions, 'deleteLivepeerStream');

// =============================================================================
// STREAM KEY GENERATION
// =============================================================================

/**
 * Generate a unique stream key.
 * 
 * Format: sk_[random 32 chars]
 * 
 * SECURITY: Stream keys should be:
 * - Unique per creator
 * - Regeneratable if compromised
 * - Never exposed to viewers
 */
function generateStreamKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'sk_';
  
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return key;
}

/**
 * Generate a unique stream ID.
 */
function generateStreamId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `stream_${timestamp}_${random}`;
}

// =============================================================================
// STREAM CRUD OPERATIONS
// =============================================================================

/**
 * Create a new stream for a creator.
 * 
 * FLOW:
 * 1. Validate creator permissions
 * 2. Generate stream key
 * 3. Create stream on provider (Livepeer)
 * 4. Store stream document in Firestore
 * 5. Return stream with credentials
 * 
 * @param creatorId - The creator's user ID
 * @param config - Stream configuration
 * @returns The created stream
 */
export async function createStream(
  creatorId: string,
  config: CreateStreamConfig
): Promise<Stream> {
  // Validate avatar for avatar mode
  if (config.mode === 'avatar' && !config.avatarUrl) {
    throw new Error('Avatar URL is required for avatar mode');
  }
  
  const streamId = generateStreamId();
  const streamKey = generateStreamKey();
  
  // In production, call Cloud Function to create on Livepeer
  // For now, generate mock provider response
  let providerResponse: ProviderStreamResponse;
  
  try {
    // Try to call Cloud Function
    const result = await createStreamOnProvider({
      title: config.title,
      creatorId,
    });
    providerResponse = result.data;
  } catch (error) {
    // Fallback to mock data for development
    console.warn('[StreamingService] Provider call failed:', error);
    providerResponse = {
      streamId: `lp_${streamId}`,
      streamKey: streamKey,
      rtmpUrl: `${PROVIDER_CONFIG.rtmpBaseUrl}/${streamKey}`,
      playbackUrl: `${PROVIDER_CONFIG.playbackBaseUrl}/${streamKey}/index.m3u8`,
    };
  }
  
  // Create stream document
  const now = new Date();
  const stream: Stream = {
    id: streamId,
    creatorId,
    title: config.title,
    description: config.description,
    thumbnailUrl: config.thumbnailUrl,
    status: 'configuring',
    visibility: config.visibility,
    mode: config.mode,
    avatarUrl: config.avatarUrl,
    
    // Credentials
    streamKey: providerResponse.streamKey,
    rtmpUrl: providerResponse.rtmpUrl,
    playbackUrl: providerResponse.playbackUrl,
    providerStreamId: providerResponse.streamId,
    
    // Timestamps
    createdAt: now,
    updatedAt: now,
    
    // Stats
    viewerCount: 0,
    peakViewerCount: 0,
    totalViewers: 0,
    
    // Moderation
    isSuspended: false,
  };
  
  // Save to Firestore
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  await setDoc(streamRef, {
    ...stream,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Also save stream key to secure subcollection
  const keyRef = doc(firestore, 'creators', creatorId, COLLECTIONS.streamKeys, 'current');
  await setDoc(keyRef, {
    id: 'current',
    key: providerResponse.streamKey,
    creatorId,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  
  return stream;
}

/**
 * Get a stream by ID.
 */
export async function getStream(streamId: string): Promise<Stream | null> {
  if (!firestore) {
    console.log('⚠️ Firebase offline, returning null for stream ID:', streamId);
    return null;
  }

  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  const streamSnap = await getDoc(streamRef);
  
  if (!streamSnap.exists()) {
    return null;
  }
  
  return docToStream(streamSnap.id, streamSnap.data());
}

/**
 * Get current stream for a creator.
 * Returns the most recent non-ended stream.
 */
export async function getCreatorCurrentStream(creatorId: string): Promise<Stream | null> {
  if (!firestore) {
    return null;
  }
  
  const streamsRef = collection(firestore, COLLECTIONS.streams);
  const q = query(
    streamsRef,
    where('creatorId', '==', creatorId),
    where('status', 'in', ['configuring', 'live']),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return docToStream(doc.id, doc.data());
}

/**
 * Get creator's stream key.
 * 
 * SECURITY: Only call this for the authenticated creator.
 */
export async function getCreatorStreamKey(creatorId: string): Promise<StreamKey | null> {
  const keyRef = doc(firestore, 'creators', creatorId, COLLECTIONS.streamKeys, 'current');
  const keySnap = await getDoc(keyRef);
  
  if (!keySnap.exists()) {
    return null;
  }
  
  const data = keySnap.data();
  return {
    id: keySnap.id,
    key: data.key,
    creatorId: data.creatorId,
    isActive: data.isActive,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastUsedAt: data.lastUsedAt?.toDate(),
    expiresAt: data.expiresAt?.toDate(),
  };
}

/**
 * Update stream data.
 */
export async function updateStream(
  streamId: string,
  data: UpdateStreamData
): Promise<void> {
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  
  await updateDoc(streamRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark stream as live.
 */
export async function setStreamLive(streamId: string): Promise<void> {
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  
  await updateDoc(streamRef, {
    status: 'live',
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * End a stream.
 */
export async function endStream(streamId: string): Promise<void> {
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  
  await updateDoc(streamRef, {
    status: 'ended',
    endedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a stream (and remove from provider).
 */
export async function deleteStream(streamId: string): Promise<void> {
  const stream = await getStream(streamId);
  
  if (!stream) {
    throw new Error('Stream not found');
  }
  
  // Delete from provider
  if (stream.providerStreamId) {
    try {
      await deleteStreamOnProvider({ providerStreamId: stream.providerStreamId });
    } catch (error) {
      console.warn('[StreamingService] Failed to delete from provider:', error);
    }
  }
  
  // Delete from Firestore
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  await deleteDoc(streamRef);
}

/**
 * Regenerate stream key for a creator.
 * 
 * Use this if the stream key is compromised.
 */
export async function regenerateStreamKey(creatorId: string): Promise<string> {
  const newKey = generateStreamKey();
  
  const keyRef = doc(firestore, 'creators', creatorId, COLLECTIONS.streamKeys, 'current');
  await setDoc(keyRef, {
    id: 'current',
    key: newKey,
    creatorId,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  
  return newKey;
}

// =============================================================================
// STREAM QUERIES
// =============================================================================

/**
 * Get live streams.
 */
export async function getLiveStreams(
  options: StreamQueryOptions = {}
): Promise<StreamListResponse> {
  if (!firestore) {
    console.log('⚠️ Firebase offline, returning empty streams list');
    return { streams: [], hasMore: false };
  }

  const { visibility, limit: queryLimit = 20, startAfter: cursor } = options;
  
  // Always filter by visibility to avoid permission errors
  // Default to 'public' if not specified
  const effectiveVisibility = visibility || 'public';
  
  let q = query(
    collection(firestore, COLLECTIONS.streams),
    where('status', '==', 'live'),
    where('visibility', '==', effectiveVisibility),
    where('isSuspended', '==', false),
    orderBy('viewerCount', 'desc'),
    limit(queryLimit)
  );
  
  // Add pagination cursor
  if (cursor) {
    const cursorDoc = await getDoc(doc(firestore, COLLECTIONS.streams, cursor));
    if (cursorDoc.exists()) {
      q = query(q, startAfter(cursorDoc));
    }
  }
  
  const snapshot = await getDocs(q);
  const streams = snapshot.docs.map((d) => docToStream(d.id, d.data()));
  
  return {
    streams,
    hasMore: streams.length === queryLimit,
    lastId: streams.length > 0 ? streams[streams.length - 1].id : undefined,
  };
}

/**
 * Get streams by creator.
 */
export async function getCreatorStreams(
  creatorId: string,
  options: StreamQueryOptions = {}
): Promise<StreamListResponse> {
  // PHASE 3B: Return empty list if Firebase is not initialized
  if (!firestore) {
    console.log('⚠️ Firebase offline, returning empty creator streams list');
    return {
      streams: [],
      hasMore: false,
      lastId: undefined,
    };
  }
  
  const { status, limit: queryLimit = 20 } = options;
  
  let q = query(
    collection(firestore, COLLECTIONS.streams),
    where('creatorId', '==', creatorId),
    orderBy('createdAt', 'desc'),
    limit(queryLimit)
  );
  
  // Add status filter
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    q = query(
      collection(firestore, COLLECTIONS.streams),
      where('creatorId', '==', creatorId),
      where('status', 'in', statuses),
      orderBy('createdAt', 'desc'),
      limit(queryLimit)
    );
  }
  
  const snapshot = await getDocs(q);
  const streams = snapshot.docs.map((d) => docToStream(d.id, d.data()));
  
  return {
    streams,
    hasMore: streams.length === queryLimit,
    lastId: streams.length > 0 ? streams[streams.length - 1].id : undefined,
  };
}

// =============================================================================
// VIEWER MANAGEMENT
// =============================================================================

/**
 * Record viewer join.
 */
export async function joinAsViewer(
  streamId: string,
  userId?: string
): Promise<string> {
  const viewerId = userId || `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  // Create viewer session
  const viewerRef = doc(firestore, COLLECTIONS.streams, streamId, COLLECTIONS.viewers, viewerId);
  await setDoc(viewerRef, {
    userId: userId || null,
    joinedAt: serverTimestamp(),
    deviceType: 'mobile', // TODO: Detect actual device type
  });
  
  // Increment viewer count
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  await updateDoc(streamRef, {
    viewerCount: increment(1),
    totalViewers: increment(1),
  });
  
  return viewerId;
}

/**
 * Record viewer leave.
 */
export async function leaveAsViewer(
  streamId: string,
  viewerId: string
): Promise<void> {
  // Mark viewer as left
  const viewerRef = doc(firestore, COLLECTIONS.streams, streamId, COLLECTIONS.viewers, viewerId);
  await updateDoc(viewerRef, {
    leftAt: serverTimestamp(),
  });
  
  // Decrement viewer count
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  await updateDoc(streamRef, {
    viewerCount: increment(-1),
  });
}

/**
 * Update peak viewer count if current is higher.
 */
export async function updatePeakViewers(streamId: string): Promise<void> {
  const stream = await getStream(streamId);
  
  if (stream && stream.viewerCount > stream.peakViewerCount) {
    const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
    await updateDoc(streamRef, {
      peakViewerCount: stream.viewerCount,
    });
  }
}

// =============================================================================
// REAL-TIME SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to stream updates.
 * 
 * @returns Unsubscribe function
 */
export function subscribeToStream(
  streamId: string,
  callback: (stream: Stream | null) => void
): Unsubscribe {
  if (!firestore) {
    callback(null);
    return () => {};
  }
  
  const streamRef = doc(firestore, COLLECTIONS.streams, streamId);
  
  return onSnapshot(streamRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(docToStream(snapshot.id, snapshot.data()));
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to live streams.
 * 
 * @returns Unsubscribe function
 */
export function subscribeToLiveStreams(
  callback: (streams: Stream[]) => void,
  visibility?: StreamVisibility
): Unsubscribe {
  if (!firestore) {
    console.log('⚠️ Firebase offline, subscribeToLiveStreams returning no-op');
    callback([]);
    return () => {};
  }
  
  // Always filter by visibility to avoid permission errors
  // If visibility is undefined, default to 'public' for unauthenticated users
  // Note: Callers should pass 'public' or 'membersOnly' explicitly
  const effectiveVisibility = visibility || 'public';
  
  const q = query(
    collection(firestore, COLLECTIONS.streams),
    where('status', '==', 'live'),
    where('visibility', '==', effectiveVisibility),
    where('isSuspended', '==', false),
    orderBy('viewerCount', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const streams = snapshot.docs.map((d) => docToStream(d.id, d.data()));
    callback(streams);
  }, (error) => {
    // Handle permission errors gracefully
    if (error?.code === 'permission-denied') {
      console.warn('⚠️ Permission denied for stream subscription:', error);
      callback([]);
    } else {
      console.error('Error in stream subscription:', error);
      callback([]);
    }
  });
}

// =============================================================================
// OBS SETUP
// =============================================================================

/**
 * Get OBS setup information for a creator.
 * 
 * @param streamKey - The creator's stream key
 * @returns OBS configuration info
 */
export function getOBSSetupInfo(streamKey: string): OBSSetupInfo {
  return {
    server: PROVIDER_CONFIG.rtmpBaseUrl,
    streamKey: streamKey,
    recommendedSettings: {
      videoBitrate: '2500-4000 Kbps',
      audioBitrate: '128 Kbps',
      resolution: '1280x720 (720p) or 1920x1080 (1080p)',
      fps: '30',
      encoder: 'x264 or NVENC (if available)',
    },
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert Firestore document to Stream object.
 */
function docToStream(docId: string, data: any): Stream {
  return {
    id: docId,
    creatorId: data.creatorId,
    title: data.title || 'Untitled Stream',
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    status: data.status || 'idle',
    visibility: data.visibility || 'public',
    mode: data.mode || 'video',
    avatarUrl: data.avatarUrl,
    
    streamKey: data.streamKey || '',
    rtmpUrl: data.rtmpUrl || '',
    playbackUrl: data.playbackUrl,
    providerStreamId: data.providerStreamId,
    
    createdAt: data.createdAt?.toDate() || new Date(),
    startedAt: data.startedAt?.toDate(),
    endedAt: data.endedAt?.toDate(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    
    viewerCount: data.viewerCount || 0,
    peakViewerCount: data.peakViewerCount || 0,
    totalViewers: data.totalViewers || 0,
    
    isSuspended: data.isSuspended || false,
    suspensionReason: data.suspensionReason,
  };
}

/**
 * Check if a user can view a stream based on visibility.
 */
export function canViewStream(
  stream: Stream,
  userId?: string,
  userTier?: string
): boolean {
  // Suspended streams are not viewable
  if (stream.isSuspended) {
    return false;
  }
  
  // Public streams are viewable by everyone
  if (stream.visibility === 'public') {
    return true;
  }
  
  // Members-only streams require authentication and paid tier
  if (stream.visibility === 'members') {
    if (!userId) return false;
    // TODO: Check membership tier
    return userTier !== 'free';
  }
  
  // Private streams require invitation (future feature)
  if (stream.visibility === 'private') {
    // TODO: Check invitation list
    return false;
  }
  
  return false;
}

