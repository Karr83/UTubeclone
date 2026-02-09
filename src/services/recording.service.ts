/**
 * Recording Service (VOD)
 * 
 * This service handles all recording/VOD operations including:
 * - Creating recording records when streams go live
 * - Updating recordings when processing completes
 * - Querying and managing recordings
 * - Tracking playback sessions
 * 
 * RECORDING LIFECYCLE:
 * ====================
 * 1. Stream created with recording enabled
 * 2. Stream goes live → Recording starts (handled by Livepeer)
 * 3. Stream ends → Recording processing begins
 * 4. Livepeer webhook → Recording ready with playback URL
 * 5. Recording available for replay
 * 
 * AUTOMATIC RECORDING:
 * ====================
 * Livepeer automatically records streams when configured.
 * The webhook `asset.ready` signals when recording is available.
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
  addDoc,
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
import { firestore } from '../config/firebase';
import {
  Recording,
  RecordingStatus,
  RecordingVisibility,
  CreateRecordingData,
  UpdateRecordingData,
  RecordingReadyData,
  RecordingQueryOptions,
  RecordingListResponse,
  PlaybackSession,
  RECORDING_COLLECTIONS,
  RECORDING_CONFIG,
} from '../types/recording';

// =============================================================================
// RECORDING CRUD
// =============================================================================

/**
 * Create a recording record when a stream starts.
 * 
 * This is called when a stream goes live to create a pending recording.
 * The recording will be updated when processing completes.
 * 
 * @param data - Recording creation data
 * @returns The created recording
 */
export async function createRecording(data: CreateRecordingData): Promise<Recording> {
  const recordingId = generateRecordingId();
  const now = new Date();
  
  const recording: Recording = {
    id: recordingId,
    streamId: data.streamId,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    title: data.title,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    status: 'pending',
    visibility: data.visibility,
    durationSeconds: 0,
    streamStartedAt: data.streamStartedAt,
    streamEndedAt: now, // Will be updated when stream ends
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    uniqueViewers: 0,
    peakLiveViewers: data.peakLiveViewers || 0,
    isDeleted: false,
    isHidden: false,
  };
  
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  await setDoc(recordingRef, {
    ...recording,
    streamStartedAt: Timestamp.fromDate(data.streamStartedAt),
    streamEndedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return recording;
}

/**
 * Get a recording by ID.
 */
export async function getRecording(recordingId: string): Promise<Recording | null> {
  if (!firestore) {
    console.log('⚠️ Firebase offline, returning null');
    return null;
  }

  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  const snapshot = await getDoc(recordingRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return docToRecording(snapshot.id, snapshot.data());
}

/**
 * Get a recording by stream ID.
 */
export async function getRecordingByStreamId(streamId: string): Promise<Recording | null> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingsRef = collection(firestore, RECORDING_COLLECTIONS.recordings);
  const q = query(
    recordingsRef,
    where('streamId', '==', streamId),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return docToRecording(snapshot.docs[0].id, snapshot.docs[0].data());
}

/**
 * Update a recording.
 */
export async function updateRecording(
  recordingId: string,
  data: UpdateRecordingData
): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark recording as processing (stream ended).
 */
export async function setRecordingProcessing(
  recordingId: string,
  streamEndedAt: Date,
  durationSeconds: number
): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    status: 'processing',
    streamEndedAt: Timestamp.fromDate(streamEndedAt),
    durationSeconds,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark recording as ready with playback URL.
 * Called by Livepeer webhook when processing completes.
 */
export async function setRecordingReady(
  recordingId: string,
  data: RecordingReadyData
): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    status: 'ready',
    playbackUrl: data.playbackUrl,
    downloadUrl: data.downloadUrl || null,
    providerAssetId: data.assetId,
    providerPlaybackId: data.playbackId,
    durationSeconds: data.durationSeconds,
    fileSizeBytes: data.fileSizeBytes || null,
    resolution: data.resolution || null,
    readyAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark recording as failed.
 */
export async function setRecordingFailed(
  recordingId: string,
  reason: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    status: 'failed',
    hiddenReason: reason,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft delete a recording.
 */
export async function deleteRecording(
  recordingId: string,
  deletedBy: string,
  reason?: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    status: 'deleted',
    isDeleted: true,
    deletedBy,
    deletedAt: serverTimestamp(),
    deletionReason: reason || 'Deleted by user',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently delete a recording (admin only).
 */
export async function permanentlyDeleteRecording(recordingId: string): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  await deleteDoc(recordingRef);
}

/**
 * Hide a recording (admin moderation).
 */
export async function hideRecording(
  recordingId: string,
  reason: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    isHidden: true,
    hiddenReason: reason,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Unhide a recording.
 */
export async function unhideRecording(recordingId: string): Promise<void> {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  await updateDoc(recordingRef, {
    isHidden: false,
    hiddenReason: null,
    updatedAt: serverTimestamp(),
  });
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get public recordings (for discovery).
 */
export async function getPublicRecordings(
  options: RecordingQueryOptions = {}
): Promise<RecordingListResponse> {
  if (!firestore) {
    console.log('⚠️ Firebase offline, returning empty recordings');
    return { recordings: [], hasMore: false };
  }

  const {
    limit: queryLimit = 20,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    startAfter: cursor,
  } = options;
  
  let q = query(
    collection(firestore, RECORDING_COLLECTIONS.recordings),
    where('status', '==', 'ready'),
    where('visibility', '==', 'public'),
    where('isDeleted', '==', false),
    where('isHidden', '==', false),
    orderBy(sortBy, sortDirection),
    limit(queryLimit)
  );
  
  if (cursor) {
    const cursorDoc = await getDoc(doc(firestore, RECORDING_COLLECTIONS.recordings, cursor));
    if (cursorDoc.exists()) {
      q = query(q, startAfter(cursorDoc));
    }
  }
  
  const snapshot = await getDocs(q);
  const recordings = snapshot.docs.map((d) => docToRecording(d.id, d.data()));
  
  return {
    recordings,
    hasMore: recordings.length === queryLimit,
    lastId: recordings.length > 0 ? recordings[recordings.length - 1].id : undefined,
  };
}

/**
 * Get recordings by creator.
 */
export async function getCreatorRecordings(
  creatorId: string,
  options: RecordingQueryOptions = {}
): Promise<RecordingListResponse> {
  const {
    status,
    includeDeleted = false,
    limit: queryLimit = 20,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    startAfter: cursor,
  } = options;
  
  // Build base query
  let constraints: any[] = [
    where('creatorId', '==', creatorId),
    orderBy(sortBy, sortDirection),
    limit(queryLimit),
  ];
  
  // Filter by status
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    constraints.unshift(where('status', 'in', statuses));
  }
  
  // Exclude deleted unless requested
  if (!includeDeleted) {
    constraints.unshift(where('isDeleted', '==', false));
  }
  
  if (!firestore) {
    return { recordings: [], hasMore: false };
  }
  
  let q = query(collection(firestore, RECORDING_COLLECTIONS.recordings), ...constraints);
  
  if (cursor) {
    const cursorDoc = await getDoc(doc(firestore, RECORDING_COLLECTIONS.recordings, cursor));
    if (cursorDoc.exists()) {
      q = query(q, startAfter(cursorDoc));
    }
  }
  
  const snapshot = await getDocs(q);
  const recordings = snapshot.docs.map((d) => docToRecording(d.id, d.data()));
  
  return {
    recordings,
    hasMore: recordings.length === queryLimit,
    lastId: recordings.length > 0 ? recordings[recordings.length - 1].id : undefined,
  };
}

/**
 * Get all recordings (admin).
 */
export async function getAllRecordings(
  options: RecordingQueryOptions = {}
): Promise<RecordingListResponse> {
  const {
    status,
    includeDeleted = true,
    includeHidden = true,
    limit: queryLimit = 50,
    sortBy = 'createdAt',
    sortDirection = 'desc',
  } = options;
  
  let constraints: any[] = [
    orderBy(sortBy, sortDirection),
    limit(queryLimit),
  ];
  
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    constraints.unshift(where('status', 'in', statuses));
  }
  
  if (!includeDeleted) {
    constraints.unshift(where('isDeleted', '==', false));
  }
  
  if (!includeHidden) {
    constraints.unshift(where('isHidden', '==', false));
  }
  
  if (!firestore) {
    return { recordings: [], hasMore: false };
  }
  
  const q = query(collection(firestore, RECORDING_COLLECTIONS.recordings), ...constraints);
  const snapshot = await getDocs(q);
  const recordings = snapshot.docs.map((d) => docToRecording(d.id, d.data()));
  
  return {
    recordings,
    hasMore: recordings.length === queryLimit,
    lastId: recordings.length > 0 ? recordings[recordings.length - 1].id : undefined,
  };
}

// =============================================================================
// REAL-TIME SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to a recording for real-time updates.
 */
export function subscribeToRecording(
  recordingId: string,
  callback: (recording: Recording | null) => void
): Unsubscribe {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  
  return onSnapshot(recordingRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(docToRecording(snapshot.id, snapshot.data()));
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to creator's recordings.
 */
export function subscribeToCreatorRecordings(
  creatorId: string,
  callback: (recordings: Recording[]) => void
): Unsubscribe {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const q = query(
    collection(firestore, RECORDING_COLLECTIONS.recordings),
    where('creatorId', '==', creatorId),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const recordings = snapshot.docs.map((d) => docToRecording(d.id, d.data()));
    callback(recordings);
  });
}

// =============================================================================
// VIEW TRACKING
// =============================================================================

/**
 * Track a recording view.
 * Increments view count and creates/updates playback session.
 */
export async function trackView(
  recordingId: string,
  viewerId?: string
): Promise<string> {
  // Increment view count
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
  
  const recordingRef = doc(firestore, RECORDING_COLLECTIONS.recordings, recordingId);
  await updateDoc(recordingRef, {
    viewCount: increment(1),
  });
  
  // Create playback session
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const sessionsRef = collection(firestore, RECORDING_COLLECTIONS.recordings, recordingId, 'sessions');
  
  await addDoc(sessionsRef, {
    id: sessionId,
    recordingId,
    viewerId: viewerId || null,
    startedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    watchDurationSeconds: 0,
    completed: false,
  });
  
  return sessionId;
}

/**
 * Update playback progress.
 */
export async function updatePlaybackProgress(
  recordingId: string,
  sessionId: string,
  watchDurationSeconds: number,
  completed: boolean = false
): Promise<void> {
  if (!firestore) {
    return;
  }
  
  // Find and update the session
  const sessionsRef = collection(firestore, RECORDING_COLLECTIONS.recordings, recordingId, 'sessions');
  const q = query(sessionsRef, where('id', '==', sessionId), limit(1));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    await updateDoc(snapshot.docs[0].ref, {
      lastActivityAt: serverTimestamp(),
      watchDurationSeconds,
      completed,
    });
  }
}

// =============================================================================
// PERMISSION CHECKING
// =============================================================================

/**
 * Check if a user can view a recording.
 */
export async function canViewRecording(
  recording: Recording,
  userId?: string,
  userTier?: string,
  userRole?: string
): Promise<{ canView: boolean; reason?: string }> {
  // Admins can view anything
  if (userRole === 'admin') {
    return { canView: true };
  }
  
  // Deleted recordings
  if (recording.isDeleted) {
    return { canView: false, reason: 'This recording has been deleted.' };
  }
  
  // Hidden recordings (admin only)
  if (recording.isHidden) {
    return { canView: false, reason: 'This recording is not available.' };
  }
  
  // Not ready yet
  if (recording.status !== 'ready') {
    if (recording.status === 'processing') {
      return { canView: false, reason: 'This recording is still processing.' };
    }
    if (recording.status === 'failed') {
      return { canView: false, reason: 'This recording failed to process.' };
    }
    return { canView: false, reason: 'This recording is not available yet.' };
  }
  
  // Creator can always view their own
  if (userId && userId === recording.creatorId) {
    return { canView: true };
  }
  
  // Public recordings
  if (recording.visibility === 'public') {
    return { canView: true };
  }
  
  // Members-only recordings
  if (recording.visibility === 'members') {
    if (!userId) {
      return { canView: false, reason: 'Sign in to watch this recording.' };
    }
    if (userTier === 'free') {
      return { canView: false, reason: 'Upgrade to watch this recording.' };
    }
    return { canView: true };
  }
  
  // Private recordings (creator only)
  if (recording.visibility === 'private') {
    return { canView: false, reason: 'This recording is private.' };
  }
  
  return { canView: false, reason: 'Cannot access this recording.' };
}

/**
 * Check if a user can manage a recording.
 */
export function canManageRecording(
  recording: Recording,
  userId: string,
  userRole: string
): boolean {
  // Admins can manage any recording
  if (userRole === 'admin') {
    return true;
  }
  
  // Creators can manage their own recordings
  if (recording.creatorId === userId) {
    return true;
  }
  
  return false;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a unique recording ID.
 */
function generateRecordingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `rec_${timestamp}_${random}`;
}

/**
 * Convert Firestore document to Recording object.
 */
function docToRecording(docId: string, data: any): Recording {
  return {
    id: docId,
    streamId: data.streamId,
    creatorId: data.creatorId,
    creatorName: data.creatorName || 'Unknown',
    title: data.title || 'Untitled Recording',
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    status: data.status || 'pending',
    visibility: data.visibility || 'public',
    playbackUrl: data.playbackUrl,
    downloadUrl: data.downloadUrl,
    providerAssetId: data.providerAssetId,
    providerPlaybackId: data.providerPlaybackId,
    durationSeconds: data.durationSeconds || 0,
    fileSizeBytes: data.fileSizeBytes,
    resolution: data.resolution,
    streamStartedAt: data.streamStartedAt?.toDate() || new Date(),
    streamEndedAt: data.streamEndedAt?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    readyAt: data.readyAt?.toDate(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    viewCount: data.viewCount || 0,
    uniqueViewers: data.uniqueViewers || 0,
    peakLiveViewers: data.peakLiveViewers || 0,
    isDeleted: data.isDeleted || false,
    deletedBy: data.deletedBy,
    deletedAt: data.deletedAt?.toDate(),
    deletionReason: data.deletionReason,
    isHidden: data.isHidden || false,
    hiddenReason: data.hiddenReason,
  };
}

/**
 * Format duration in seconds to human-readable string.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human-readable string.
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

