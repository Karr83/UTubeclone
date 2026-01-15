# VOD (Video on Demand) / Stream Recording Setup Guide

This document explains the VOD system architecture and setup for the MS Gift Project.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        RECORDING LIFECYCLE                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   Creator starts stream                                                       │
│         │                                                                     │
│         ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐            │
│   │              LIVEPEER AUTO-RECORD                            │            │
│   │  Stream created with record: true                           │            │
│   │  Recording starts automatically                             │            │
│   └────────────────────────┬────────────────────────────────────┘            │
│                            │                                                  │
│                            │ Stream ends (creator stops or disconnects)      │
│                            ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────┐            │
│   │              PROCESSING PHASE                                │            │
│   │  Livepeer processes recording                               │            │
│   │  Status: "processing" in Firestore                          │            │
│   │  Duration: Usually 1-5 minutes                              │            │
│   └────────────────────────┬────────────────────────────────────┘            │
│                            │                                                  │
│                            │ Webhook: asset.ready                            │
│                            ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────┐            │
│   │              RECORDING READY                                 │            │
│   │  Playback URL available                                     │            │
│   │  Status: "ready" in Firestore                               │            │
│   │  Users can now watch replay                                 │            │
│   └─────────────────────────────────────────────────────────────┘            │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Firestore Data Model

### Recordings Collection

```
/recordings/{recordingId}
```

```typescript
{
  // Identifiers
  id: "rec_abc123",
  streamId: "stream_xyz789",
  creatorId: "user_456",
  creatorName: "CreatorName",
  
  // Content
  title: "My Amazing Stream",
  description: "Stream description...",
  thumbnailUrl: "https://...",
  
  // Status
  status: "ready", // "pending" | "processing" | "ready" | "failed" | "deleted"
  visibility: "public", // "public" | "members" | "private"
  
  // Playback (available when status = "ready")
  playbackUrl: "https://livepeercdn.studio/hls/{playbackId}/index.m3u8",
  downloadUrl: "https://...", // Optional
  providerAssetId: "asset_123",
  providerPlaybackId: "playback_456",
  
  // Metadata
  durationSeconds: 3600,
  fileSizeBytes: 1073741824,
  resolution: "1920x1080",
  
  // Timestamps
  streamStartedAt: Timestamp,
  streamEndedAt: Timestamp,
  createdAt: Timestamp,
  readyAt: Timestamp, // When playback became available
  updatedAt: Timestamp,
  
  // Stats
  viewCount: 1234,
  uniqueViewers: 567,
  peakLiveViewers: 89, // From original live stream
  
  // Moderation
  isDeleted: false,
  deletedBy: null,
  deletedAt: null,
  isHidden: false,
  hiddenReason: null,
}
```

## Setup Instructions

### 1. Enable Recording in Livepeer

Recordings are automatically enabled when creating streams with `record: true`:

```javascript
// In createLivepeerStreamWithRecording Cloud Function
const stream = await fetch('https://livepeer.studio/api/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LIVEPEER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: title,
    record: true, // ← Enable recording
    profiles: [...],
  }),
});
```

### 2. Configure Livepeer Webhook for Recordings

1. Go to [Livepeer Studio → Developers → Webhooks](https://livepeer.studio/dashboard/developers/webhooks)
2. Create a new webhook:
   - **URL**: `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/livepeerRecordingWebhook`
   - **Events**: 
     - `asset.ready` - Recording processed and ready
     - `asset.failed` - Recording processing failed

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
npm run deploy
```

This deploys:
- `createLivepeerStreamWithRecording` - Create streams with recording enabled
- `livepeerRecordingWebhook` - Handle recording ready/failed events
- `createRecordingOnStreamEnd` - Create recording document when stream ends
- `deleteLivepeerAsset` - Delete recording from Livepeer

### 4. Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Recordings
match /recordings/{recordingId} {
  // Anyone can read public recordings
  allow read: if resource.data.visibility == 'public' 
              || resource.data.creatorId == request.auth.uid
              || isAdmin();
  
  // Only system can create (via Cloud Functions)
  allow create: if false;
  
  // Creators can update their own recordings
  allow update: if request.auth.uid == resource.data.creatorId 
                || isAdmin();
  
  // Creators can delete their own recordings
  allow delete: if request.auth.uid == resource.data.creatorId 
                || isAdmin();
}
```

## Recording Flow

### When Stream Starts

1. Creator creates stream with `createLivepeerStreamWithRecording`
2. Stream starts on Livepeer with recording enabled
3. Recording happens automatically during stream

### When Stream Ends

1. `livepeerWebhook` receives `stream.idle` event
2. `createRecordingOnStreamEnd` is called
3. Recording document created in Firestore with status `"processing"`

### When Recording is Ready

1. `livepeerRecordingWebhook` receives `asset.ready` event
2. Recording document updated with:
   - `status: "ready"`
   - `playbackUrl`
   - `durationSeconds`
   - `fileSizeBytes`
   - `resolution`
3. Recording is now viewable

### When Recording Fails

1. `livepeerRecordingWebhook` receives `asset.failed` event
2. Recording document updated with `status: "failed"`
3. Users see error message when trying to view

## Frontend Screens

| Screen | Purpose |
|--------|---------|
| `RecordingsListScreen` | Browse public recordings |
| `ReplayScreen` | Watch a recording |
| `RecordingsManageScreen` | Creator: manage own recordings |

## Hooks

| Hook | Purpose |
|------|---------|
| `useRecording` | Creator recording management |
| `useReplayViewer` | Viewer playback with tracking |

## Permission Matrix

| Action | User | Creator (Own) | Creator (Other) | Admin |
|--------|------|---------------|-----------------|-------|
| View public | ✅ | ✅ | ✅ | ✅ |
| View members-only | ❌ (upgrade) | ✅ | ❌ (upgrade) | ✅ |
| View private | ❌ | ✅ | ❌ | ✅ |
| Edit | ❌ | ✅ | ❌ | ✅ |
| Delete | ❌ | ✅ | ❌ | ✅ |
| Hide | ❌ | ❌ | ❌ | ✅ |

## Configuration

```typescript
// src/types/recording.ts
export const RECORDING_CONFIG = {
  MAX_DURATION_HOURS: 4,        // Maximum recording length
  MIN_DURATION_SECONDS: 60,     // Minimum to save
  DEFAULT_RETENTION_DAYS: 90,   // How long to keep
  THUMBNAIL_CAPTURE_TIME: 10,   // Seconds from start
};
```

## Troubleshooting

### Recording Not Created

1. Check stream was created with `record: true`
2. Verify stream duration was > 60 seconds
3. Check Cloud Function logs for errors

### Recording Stuck in "Processing"

1. Check Livepeer Studio for asset status
2. Verify webhook URL is correct
3. Check Cloud Function logs for webhook events

### Playback URL Not Working

1. Verify `playbackUrl` format: `https://livepeercdn.studio/hls/{playbackId}/index.m3u8`
2. Check asset status in Livepeer Studio
3. Try HLS player directly to rule out app issues

### Webhook Not Firing

1. Verify webhook is registered in Livepeer Studio
2. Check selected events include `asset.ready` and `asset.failed`
3. Verify Cloud Function is deployed and accessible

