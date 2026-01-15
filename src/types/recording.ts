/**
 * Recording Types (VOD)
 * 
 * This file defines all TypeScript interfaces and types for the
 * stream recording and replay (VOD) feature.
 * 
 * RECORDING ARCHITECTURE:
 * =======================
 * 
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                      RECORDING LIFECYCLE                                 │
 *   ├─────────────────────────────────────────────────────────────────────────┤
 *   │                                                                          │
 *   │   Stream Goes Live                                                       │
 *   │         │                                                                │
 *   │         ▼                                                                │
 *   │   ┌─────────────────┐                                                   │
 *   │   │  Livepeer Auto  │  Recording starts automatically                   │
 *   │   │  Recording      │  (configured in stream settings)                  │
 *   │   └────────┬────────┘                                                   │
 *   │            │                                                             │
 *   │            │ Stream Ends                                                 │
 *   │            ▼                                                             │
 *   │   ┌─────────────────┐                                                   │
 *   │   │  Recording      │  Recording stops, processing begins               │
 *   │   │  Processing     │  (transcoding for VOD playback)                   │
 *   │   └────────┬────────┘                                                   │
 *   │            │                                                             │
 *   │            │ Webhook: asset.ready                                       │
 *   │            ▼                                                             │
 *   │   ┌─────────────────┐                                                   │
 *   │   │  Recording      │  Playback URL available                           │
 *   │   │  Available      │  Stored in Firestore                              │
 *   │   └─────────────────┘                                                   │
 *   │                                                                          │
 *   └─────────────────────────────────────────────────────────────────────────┘
 * 
 * DATA STORAGE:
 * =============
 * - Recordings: /recordings/{recordingId}
 * - Creator recordings: Query by creatorId
 * - Public recordings: Query by isPublic = true
 */

// =============================================================================
// RECORDING STATUS
// =============================================================================

/**
 * Recording processing status.
 * 
 * Status flow: pending → processing → ready (or failed)
 */
export type RecordingStatus =
  | 'pending'     // Recording created, waiting for stream to end
  | 'processing'  // Stream ended, recording being processed
  | 'ready'       // Recording ready for playback
  | 'failed'      // Recording failed
  | 'deleted';    // Recording soft-deleted

/**
 * Recording visibility.
 */
export type RecordingVisibility =
  | 'public'      // Anyone can view
  | 'members'     // Members only
  | 'private';    // Creator only

// =============================================================================
// RECORDING MODEL
// =============================================================================

/**
 * Recording document stored in Firestore.
 * 
 * Collection: /recordings/{recordingId}
 */
export interface Recording {
  /** Unique recording ID (Firestore document ID) */
  id: string;
  
  /** Original stream ID */
  streamId: string;
  
  /** Creator's user ID */
  creatorId: string;
  
  /** Creator's display name (for display) */
  creatorName: string;
  
  /** Recording title (defaults to stream title) */
  title: string;
  
  /** Optional description */
  description?: string;
  
  /** Thumbnail URL */
  thumbnailUrl?: string;
  
  /** Current processing status */
  status: RecordingStatus;
  
  /** Who can view this recording */
  visibility: RecordingVisibility;
  
  // ---------------------------------------------------------------------------
  // PLAYBACK
  // ---------------------------------------------------------------------------
  
  /** HLS playback URL (available when status = ready) */
  playbackUrl?: string;
  
  /** Download URL (if downloads enabled) */
  downloadUrl?: string;
  
  /** Provider-specific asset ID */
  providerAssetId?: string;
  
  /** Provider-specific playback ID */
  providerPlaybackId?: string;
  
  // ---------------------------------------------------------------------------
  // DURATION & SIZE
  // ---------------------------------------------------------------------------
  
  /** Recording duration in seconds */
  durationSeconds: number;
  
  /** Recording file size in bytes */
  fileSizeBytes?: number;
  
  /** Video resolution */
  resolution?: string;
  
  // ---------------------------------------------------------------------------
  // TIMESTAMPS
  // ---------------------------------------------------------------------------
  
  /** When the original stream started */
  streamStartedAt: Date;
  
  /** When the original stream ended */
  streamEndedAt: Date;
  
  /** When recording document was created */
  createdAt: Date;
  
  /** When recording became ready for playback */
  readyAt?: Date;
  
  /** Last updated */
  updatedAt: Date;
  
  // ---------------------------------------------------------------------------
  // STATS
  // ---------------------------------------------------------------------------
  
  /** Total view count */
  viewCount: number;
  
  /** Unique viewers */
  uniqueViewers: number;
  
  /** Peak concurrent viewers from live stream */
  peakLiveViewers: number;
  
  // ---------------------------------------------------------------------------
  // MODERATION
  // ---------------------------------------------------------------------------
  
  /** Whether recording is soft-deleted */
  isDeleted: boolean;
  
  /** Who deleted it */
  deletedBy?: string;
  
  /** When deleted */
  deletedAt?: Date;
  
  /** Deletion reason */
  deletionReason?: string;
  
  /** Whether recording is hidden by admin */
  isHidden: boolean;
  
  /** Why it was hidden */
  hiddenReason?: string;
}

// =============================================================================
// CREATE/UPDATE TYPES
// =============================================================================

/**
 * Data for creating a recording record.
 * Created automatically when a stream goes live.
 */
export interface CreateRecordingData {
  /** Stream ID */
  streamId: string;
  
  /** Creator ID */
  creatorId: string;
  
  /** Creator name */
  creatorName: string;
  
  /** Title */
  title: string;
  
  /** Description */
  description?: string;
  
  /** Thumbnail URL */
  thumbnailUrl?: string;
  
  /** Visibility setting */
  visibility: RecordingVisibility;
  
  /** When stream started */
  streamStartedAt: Date;
  
  /** Peak viewers from live stream */
  peakLiveViewers?: number;
}

/**
 * Data for updating a recording.
 */
export interface UpdateRecordingData {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  visibility?: RecordingVisibility;
}

/**
 * Data from Livepeer when recording is ready.
 */
export interface RecordingReadyData {
  /** Provider asset ID */
  assetId: string;
  
  /** Playback ID */
  playbackId: string;
  
  /** HLS playback URL */
  playbackUrl: string;
  
  /** Download URL */
  downloadUrl?: string;
  
  /** Duration in seconds */
  durationSeconds: number;
  
  /** File size in bytes */
  fileSizeBytes?: number;
  
  /** Video resolution (e.g., "1920x1080") */
  resolution?: string;
}

// =============================================================================
// QUERY TYPES
// =============================================================================

/**
 * Options for querying recordings.
 */
export interface RecordingQueryOptions {
  /** Filter by creator */
  creatorId?: string;
  
  /** Filter by visibility */
  visibility?: RecordingVisibility;
  
  /** Filter by status */
  status?: RecordingStatus | RecordingStatus[];
  
  /** Include deleted recordings */
  includeDeleted?: boolean;
  
  /** Include hidden recordings (admin only) */
  includeHidden?: boolean;
  
  /** Sort field */
  sortBy?: 'createdAt' | 'viewCount' | 'durationSeconds';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Limit results */
  limit?: number;
  
  /** Pagination cursor */
  startAfter?: string;
}

/**
 * Recording list response.
 */
export interface RecordingListResponse {
  recordings: Recording[];
  hasMore: boolean;
  lastId?: string;
}

// =============================================================================
// PLAYBACK TYPES
// =============================================================================

/**
 * Recording playback session.
 */
export interface PlaybackSession {
  /** Session ID */
  id: string;
  
  /** Recording ID */
  recordingId: string;
  
  /** Viewer user ID (null if anonymous) */
  viewerId?: string;
  
  /** When playback started */
  startedAt: Date;
  
  /** Last activity time */
  lastActivityAt: Date;
  
  /** Watch duration in seconds */
  watchDurationSeconds: number;
  
  /** Whether completed (watched to end) */
  completed: boolean;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Recording context for creators.
 */
export interface RecordingContextValue {
  /** Creator's recordings */
  recordings: Recording[];
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Update recording */
  updateRecording: (recordingId: string, data: UpdateRecordingData) => Promise<void>;
  
  /** Delete recording */
  deleteRecording: (recordingId: string, reason?: string) => Promise<void>;
  
  /** Refresh recordings list */
  refresh: () => Promise<void>;
}

/**
 * Replay viewer context.
 */
export interface ReplayViewerContextValue {
  /** Current recording */
  recording: Recording | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Playback URL */
  playbackUrl: string | null;
  
  /** Whether recording is available */
  isAvailable: boolean;
  
  /** Load a recording */
  loadRecording: (recordingId: string) => Promise<boolean>;
  
  /** Track view */
  trackView: () => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Recording configuration.
 */
export const RECORDING_CONFIG = {
  /** Maximum recording duration in hours */
  MAX_DURATION_HOURS: 4,
  
  /** Minimum duration to save (seconds) */
  MIN_DURATION_SECONDS: 60,
  
  /** Default retention days */
  DEFAULT_RETENTION_DAYS: 90,
  
  /** Thumbnail capture time (seconds from start) */
  THUMBNAIL_CAPTURE_TIME: 10,
} as const;

/**
 * Firestore collection paths.
 */
export const RECORDING_COLLECTIONS = {
  recordings: 'recordings',
  playbackSessions: 'playbackSessions',
} as const;

