# Live Streaming Setup Guide

This guide explains how to set up live streaming for the MS Gift platform using Livepeer.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        LIVE STREAMING ARCHITECTURE                              │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│    CREATOR                                                                      │
│    ┌─────────────────┐                                                         │
│    │ OBS Studio      │                                                         │
│    │ or Mobile App   │                                                         │
│    └────────┬────────┘                                                         │
│             │                                                                   │
│             │ RTMP Push                                                         │
│             │ rtmp://rtmp.livepeer.com/live/{stream_key}                       │
│             ▼                                                                   │
│    ┌─────────────────────────────────────────────────────────┐                 │
│    │                     LIVEPEER                             │                 │
│    │  ┌──────────┐    ┌──────────────┐    ┌─────────────┐   │                 │
│    │  │  Ingest  │───▶│  Transcode   │───▶│    CDN      │   │                 │
│    │  │  Server  │    │  (720p,480p, │    │  Delivery   │   │                 │
│    │  │          │    │   360p)      │    │             │   │                 │
│    │  └──────────┘    └──────────────┘    └──────┬──────┘   │                 │
│    └─────────────────────────────────────────────│──────────┘                 │
│                                                  │                             │
│                                                  │ HLS Playback                │
│                                                  │ https://livepeercdn.studio/ │
│                                                  │   hls/{playback_id}/        │
│                                                  │   index.m3u8                │
│                                                  ▼                             │
│    ┌─────────────────────────────────────────────────────────┐                 │
│    │                      VIEWERS                             │                 │
│    │  ┌──────────┐    ┌──────────┐    ┌──────────┐          │                 │
│    │  │ iOS App  │    │ Android  │    │   Web    │          │                 │
│    │  │          │    │  App     │    │          │          │                 │
│    │  └──────────┘    └──────────┘    └──────────┘          │                 │
│    └─────────────────────────────────────────────────────────┘                 │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

## What is Livepeer?

Livepeer is a decentralized video streaming protocol that provides:
- **RTMP Ingest**: Accept streams from OBS/encoders
- **Transcoding**: Convert to multiple quality levels
- **CDN Delivery**: Distribute globally via HLS
- **Low Latency**: ~5-10 seconds delay
- **Cost Effective**: Up to 10x cheaper than traditional CDNs

## Step 1: Create Livepeer Account

1. Go to [https://livepeer.studio](https://livepeer.studio)
2. Sign up for an account
3. Navigate to **Developers** → **API Keys**
4. Create a new API key
5. Copy the API key (you'll need it later)

## Step 2: Set Up Firebase Functions

Store the API key securely in Firebase:

```bash
# Navigate to your project
cd ms-gift-project

# Set Livepeer API key
firebase functions:config:set livepeer.api_key="YOUR_API_KEY_HERE"

# Deploy functions
cd functions && npm install && npm run deploy
```

## Step 3: Configure Webhook (Auto-Detect Live Status)

For automatic stream status detection:

1. Go to Livepeer Studio Dashboard
2. Navigate to **Developers** → **Webhooks**
3. Click **Create Webhook**
4. Enter endpoint URL:
   ```
   https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/livepeerWebhook
   ```
5. Select events:
   - `stream.started` - When stream goes live
   - `stream.idle` - When stream goes offline
6. Click **Create**

Now streams will automatically switch between "configuring" and "live" status!

## Step 4: Install Video Player

For HLS playback in the app, install expo-av:

```bash
npx expo install expo-av
```

Then update `LiveStreamScreen.tsx` to use the real video player:

```tsx
import { Video, ResizeMode } from 'expo-av';

// Replace MockVideoPlayer with:
<Video
  source={{ uri: playbackUrl }}
  rate={1.0}
  volume={1.0}
  isMuted={false}
  resizeMode={ResizeMode.CONTAIN}
  shouldPlay
  isLooping={false}
  style={{ width: '100%', aspectRatio: 16/9 }}
  useNativeControls
/>
```

## Firestore Data Model

### Streams Collection (`/streams/{streamId}`)

```typescript
{
  id: "stream_abc123",
  creatorId: "user_xyz789",
  title: "My First Stream",
  description: "Welcome to my channel!",
  
  // Status
  status: "live", // "idle" | "configuring" | "live" | "ended"
  visibility: "public", // "public" | "members" | "private"
  mode: "video", // "video" | "audio_only" | "avatar"
  
  // Credentials (NEVER expose to viewers)
  streamKey: "sk_abcd1234...",
  rtmpUrl: "rtmp://rtmp.livepeer.com/live/sk_abcd1234...",
  playbackUrl: "https://livepeercdn.studio/hls/abc123/index.m3u8",
  providerStreamId: "lp_stream_123",
  
  // Timestamps
  createdAt: Timestamp,
  startedAt: Timestamp,
  endedAt: Timestamp,
  
  // Stats
  viewerCount: 42,
  peakViewerCount: 100,
  totalViewers: 500,
  
  // Moderation
  isSuspended: false,
}
```

### Stream Keys Collection (`/creators/{creatorId}/streamKeys/current`)

```typescript
{
  id: "current",
  key: "sk_abcd1234...",
  creatorId: "user_xyz789",
  isActive: true,
  createdAt: Timestamp,
  lastUsedAt: Timestamp,
}
```

## Stream Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STREAM STATUS FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌──────────┐                                                  │
│    │   idle   │  Creator has no active stream                   │
│    └────┬─────┘                                                  │
│         │                                                        │
│         │ createStream()                                         │
│         ▼                                                        │
│    ┌──────────────┐                                             │
│    │ configuring  │  Stream created, waiting for RTMP data      │
│    └──────┬───────┘                                             │
│           │                                                      │
│           │ OBS connects / Livepeer webhook                     │
│           ▼                                                      │
│    ┌──────────┐                                                  │
│    │   live   │  Currently broadcasting                         │
│    └────┬─────┘                                                  │
│         │                                                        │
│         │ endStream() / OBS disconnects                         │
│         ▼                                                        │
│    ┌──────────┐                                                  │
│    │  ended   │  Stream finished                                │
│    └──────────┘                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Identity Protection Modes

The platform supports three streaming modes for identity protection:

### 1. Video Mode (`video`)
- Full camera + audio
- Traditional streaming experience

### 2. Audio Only Mode (`audio_only`)
- No camera required
- Audio only with a placeholder visual
- Perfect for podcasts, discussions, or anonymous streaming

### 3. Avatar Mode (`avatar`)
- Audio + static image/avatar
- Creator uploads an avatar image
- Image is displayed while audio plays
- Great for privacy-conscious creators

## Creator Stream Flow

```typescript
// 1. Create a stream
const stream = await createStream(creatorId, {
  title: "My Stream",
  visibility: "public",
  mode: "video", // or "audio_only" or "avatar"
});

// 2. Get OBS setup info
const obsSetup = getOBSSetupInfo(stream.streamKey);
// {
//   server: "rtmp://rtmp.livepeer.com/live",
//   streamKey: "sk_abc123...",
//   recommendedSettings: { ... }
// }

// 3. Creator configures OBS with these credentials

// 4. Creator clicks "Start Streaming" in OBS

// 5. Livepeer webhook fires, status changes to "live"

// 6. When done, creator clicks "End Stream" in app
await endStream(streamId);
```

## Viewer Watch Flow

```typescript
// 1. Get list of live streams
const { streams } = await getLiveStreams({ visibility: "public" });

// 2. Join a stream
const viewerId = await joinAsViewer(streamId, userId);
// This increments viewerCount

// 3. Subscribe to real-time updates
const unsubscribe = subscribeToStream(streamId, (stream) => {
  // Update UI when stream changes
  if (stream.status === "ended") {
    // Show "Stream ended" message
  }
});

// 4. When viewer leaves
await leaveAsViewer(streamId, viewerId);
// This decrements viewerCount
```

## Security Considerations

### Stream Key Protection
- Stream keys are stored in a separate subcollection
- Only the creator can access their own stream key
- Keys can be regenerated if compromised

### Viewer Access Control
- Public streams: Anyone can watch
- Members-only streams: Requires paid membership
- Suspended streams: No one can watch

### Firestore Security Rules

```javascript
// Example rules for streams
match /streams/{streamId} {
  // Anyone can read public streams
  allow read: if resource.data.visibility == "public"
              || resource.data.visibility == "members" && request.auth != null;
  
  // Only the creator can write
  allow write: if request.auth != null 
               && request.auth.uid == resource.data.creatorId;
}

// Stream keys are private
match /creators/{creatorId}/streamKeys/{keyId} {
  allow read, write: if request.auth != null 
                     && request.auth.uid == creatorId;
}
```

## Costs

Livepeer pricing (as of 2026):
- **Transcoding**: ~$0.005 per minute
- **Delivery**: ~$0.01 per GB

Example: 1 hour stream with 100 viewers ≈ $0.30 + $0.50 = $0.80

Compare to AWS: ~$5-10 for the same stream!

## Alternatives to Livepeer

If Livepeer doesn't meet your needs:

| Provider | Pros | Cons |
|----------|------|------|
| **Mux** | Great dashboard, simple API | More expensive |
| **AWS IVS** | AWS integration, reliable | Complex setup |
| **Cloudflare Stream** | Global CDN, cheap | Limited features |
| **Wowza** | Self-hosted option | Requires servers |

The streaming service is provider-agnostic - just implement the same interface!

## Troubleshooting

### Stream not going live
1. Check OBS is connected (green light in bottom right)
2. Verify stream key is correct
3. Check Livepeer Studio dashboard for errors

### High latency
1. Use a closer ingest server
2. Reduce bitrate
3. Check encoder settings

### Webhook not firing
1. Verify webhook URL in Livepeer dashboard
2. Check Firebase Functions logs
3. Ensure HTTPS is being used

## Support

- Livepeer Docs: [docs.livepeer.org](https://docs.livepeer.org)
- Livepeer Discord: [discord.gg/livepeer](https://discord.gg/livepeer)
- Firebase Functions: [firebase.google.com/docs/functions](https://firebase.google.com/docs/functions)

