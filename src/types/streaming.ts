/**
 * Streaming Types
 * 
 * This file defines all TypeScript interfaces and types for the
 * live streaming feature. Designed to be provider-agnostic.
 * 
 * STREAMING ARCHITECTURE:
 * =======================
 * 
 *   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 *   │    Creator      │     │    Livepeer     │     │    Viewers      │
 *   │   (OBS/App)     │     │   (Provider)    │     │    (App)        │
 *   └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
 *            │                       │                       │
 *            │ 1. RTMP push          │                       │
 *            │    (stream key)       │                       │
 *            ├──────────────────────▶│                       │
 *            │                       │                       │
 *            │                       │ 2. Transcode &        │
 *            │                       │    distribute         │
 *            │                       │                       │
 *            │                       │◀──────────────────────┤
 *            │                       │ 3. HLS playback       │
 *            │                       │                       │
 * 
 * IDENTITY PROTECTION:
 * ====================
 * - Creators can stream audio-only (no camera required)
 * - Avatar/image overlay mode supported
 * - Stream key is private (never shown to viewers)
 * - Creator identity can be pseudonymous
 * 
 * SUPPORTED PROVIDERS:
 * - Livepeer (primary - decentralized)
 * - Mux (alternative)
 * - Custom RTMP server (self-hosted)
 */

// =============================================================================
// STREAM STATUS
// =============================================================================

/**
 * Stream lifecycle states.
 * 
 * State transitions:
 * - idle → configuring → live → ended
 * - idle → configuring → idle (cancelled)
 * - live → ended (normal end)
 * - live → ended (connection lost)
 */
export type StreamStatus = 
  | 'idle'        // No stream configured
  | 'configuring' // Stream created, waiting for RTMP connection
  | 'live'        // Currently broadcasting
  | 'ended';      // Stream has ended

/**
 * Stream visibility settings.
 */
export type StreamVisibility = 
  | 'public'      // Anyone can watch
  | 'members'     // Only members can watch
  | 'private';    // Invite-only (future feature)

/**
 * Stream content mode for identity protection.
 */
export type StreamMode = 
  | 'video'       // Full video + audio
  | 'audio_only'  // Audio only (no camera)
  | 'avatar';     // Audio + static avatar/image

// =============================================================================
// STREAM MODEL
// =============================================================================

/**
 * Core stream document stored in Firestore.
 * Collection: /streams/{streamId}
 */
export interface Stream {
  /** Unique stream ID (Firestore document ID) */
  id: string;
  
  /** Creator's user ID */
  creatorId: string;
  
  /** Stream title (shown to viewers) */
  title: string;
  
  /** Optional description */
  description?: string;
  
  /** Thumbnail URL (optional) */
  thumbnailUrl?: string;
  
  /** Current stream status */
  status: StreamStatus;
  
  /** Who can watch this stream */
  visibility: StreamVisibility;
  
  /** Content mode (video/audio/avatar) */
  mode: StreamMode;
  
  /** Avatar image URL (if mode is 'avatar') */
  avatarUrl?: string;
  
  // ---------------------------------------------------------------------------
  // STREAMING CREDENTIALS (Private - never expose to viewers)
  // ---------------------------------------------------------------------------
  
  /** 
   * Unique stream key for RTMP push.
   * 
   * SECURITY: This is sensitive! Only show to the stream creator.
   * Store in a subcollection or separate secure document if needed.
   */
  streamKey: string;
  
  /** RTMP ingest URL (where creator pushes stream) */
  rtmpUrl: string;
  
  /** HLS playback URL (where viewers watch) */
  playbackUrl?: string;
  
  /** Provider-specific stream ID */
  providerStreamId?: string;
  
  // ---------------------------------------------------------------------------
  // TIMESTAMPS
  // ---------------------------------------------------------------------------
  
  /** When stream was created */
  createdAt: Date;
  
  /** When stream went live */
  startedAt?: Date;
  
  /** When stream ended */
  endedAt?: Date;
  
  /** Last updated */
  updatedAt: Date;
  
  // ---------------------------------------------------------------------------
  // VIEWER STATS (Updated periodically)
  // ---------------------------------------------------------------------------
  
  /** Current viewer count */
  viewerCount: number;
  
  /** Peak viewer count during this stream */
  peakViewerCount: number;
  
  /** Total unique viewers */
  totalViewers: number;
  
  // ---------------------------------------------------------------------------
  // MODERATION
  // ---------------------------------------------------------------------------
  
  /** Whether stream is suspended by admin */
  isSuspended: boolean;
  
  /** Suspension reason (if suspended) */
  suspensionReason?: string;
}

// =============================================================================
// STREAM KEY
// =============================================================================

/**
 * Stream key document.
 * Stored separately for security: /creators/{creatorId}/streamKeys/{keyId}
 * 
 * Each creator gets one active stream key at a time.
 * Keys can be regenerated if compromised.
 */
export interface StreamKey {
  /** Key ID */
  id: string;
  
  /** The actual stream key value */
  key: string;
  
  /** Creator ID */
  creatorId: string;
  
  /** Whether this key is active */
  isActive: boolean;
  
  /** When key was created */
  createdAt: Date;
  
  /** When key was last used */
  lastUsedAt?: Date;
  
  /** When key expires (optional) */
  expiresAt?: Date;
}

// =============================================================================
// STREAM CONFIGURATION
// =============================================================================

/**
 * Configuration for creating a new stream.
 */
export interface CreateStreamConfig {
  /** Stream title */
  title: string;
  
  /** Optional description */
  description?: string;
  
  /** Visibility setting */
  visibility: StreamVisibility;
  
  /** Content mode */
  mode: StreamMode;
  
  /** Avatar URL (required if mode is 'avatar') */
  avatarUrl?: string;
  
  /** Custom thumbnail */
  thumbnailUrl?: string;
}

/**
 * Stream update data.
 */
export interface UpdateStreamData {
  title?: string;
  description?: string;
  visibility?: StreamVisibility;
  mode?: StreamMode;
  avatarUrl?: string;
  thumbnailUrl?: string;
}

// =============================================================================
// PROVIDER ABSTRACTION
// =============================================================================

/**
 * Supported streaming providers.
 */
export type StreamingProvider = 'livepeer' | 'mux' | 'custom';

/**
 * Provider configuration.
 */
export interface ProviderConfig {
  /** Provider name */
  provider: StreamingProvider;
  
  /** API key (stored securely on backend) */
  apiKey?: string;
  
  /** Base RTMP URL */
  rtmpBaseUrl: string;
  
  /** Playback base URL */
  playbackBaseUrl: string;
}

/**
 * Response from provider when creating a stream.
 */
export interface ProviderStreamResponse {
  /** Provider's stream ID */
  streamId: string;
  
  /** Stream key for RTMP push */
  streamKey: string;
  
  /** Full RTMP URL */
  rtmpUrl: string;
  
  /** HLS playback URL */
  playbackUrl: string;
}

// =============================================================================
// VIEWER TYPES
// =============================================================================

/**
 * Viewer session info.
 * Tracked for viewer count and analytics (future).
 */
export interface ViewerSession {
  /** Session ID */
  id: string;
  
  /** Viewer user ID (null if anonymous) */
  userId?: string;
  
  /** Stream ID being watched */
  streamId: string;
  
  /** When viewer joined */
  joinedAt: Date;
  
  /** When viewer left (null if still watching) */
  leftAt?: Date;
  
  /** Device type */
  deviceType: 'ios' | 'android' | 'web';
}

// =============================================================================
// OBS CONFIGURATION
// =============================================================================

/**
 * OBS setup information to display to creators.
 */
export interface OBSSetupInfo {
  /** RTMP server URL */
  server: string;
  
  /** Stream key */
  streamKey: string;
  
  /** Recommended settings */
  recommendedSettings: {
    videoBitrate: string;
    audioBitrate: string;
    resolution: string;
    fps: string;
    encoder: string;
  };
}

// =============================================================================
// STREAM EVENTS
// =============================================================================

/**
 * Stream lifecycle events for real-time updates.
 */
export type StreamEventType =
  | 'stream.created'
  | 'stream.live'
  | 'stream.ended'
  | 'stream.suspended'
  | 'viewer.joined'
  | 'viewer.left';

/**
 * Stream event payload.
 */
export interface StreamEvent {
  type: StreamEventType;
  streamId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Stream context value for creators.
 */
export interface StreamContextValue {
  /** Current stream (if any) */
  currentStream: Stream | null;
  
  /** Whether stream is loading */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Create a new stream */
  createStream: (config: CreateStreamConfig) => Promise<Stream>;
  
  /** Start streaming (mark as live) */
  goLive: () => Promise<void>;
  
  /** End current stream */
  endStream: () => Promise<void>;
  
  /** Update stream settings */
  updateStream: (data: UpdateStreamData) => Promise<void>;
  
  /** Get OBS setup info */
  getOBSSetup: () => OBSSetupInfo | null;
  
  /** Regenerate stream key */
  regenerateKey: () => Promise<string>;
}

/**
 * Viewer context value.
 */
export interface ViewerContextValue {
  /** Stream being watched */
  stream: Stream | null;
  
  /** Whether stream is loading */
  isLoading: boolean;
  
  /** Playback URL */
  playbackUrl: string | null;
  
  /** Whether stream is live */
  isLive: boolean;
  
  /** Current viewer count */
  viewerCount: number;
  
  /** Error message */
  error: string | null;
  
  /** Join stream as viewer */
  joinStream: (streamId: string) => Promise<void>;
  
  /** Leave stream */
  leaveStream: () => void;
  
  /** Refresh stream data */
  refreshStream: () => Promise<void>;
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

/**
 * Options for querying streams.
 */
export interface StreamQueryOptions {
  /** Filter by status */
  status?: StreamStatus | StreamStatus[];
  
  /** Filter by visibility */
  visibility?: StreamVisibility;
  
  /** Filter by creator */
  creatorId?: string;
  
  /** Sort by field */
  sortBy?: 'createdAt' | 'startedAt' | 'viewerCount';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Limit results */
  limit?: number;
  
  /** Pagination cursor */
  startAfter?: string;
}

/**
 * Stream list response.
 */
export interface StreamListResponse {
  streams: Stream[];
  hasMore: boolean;
  lastId?: string;
}

