# OBS Studio Setup Guide for Streaming

This guide will help you set up OBS Studio to stream to the MS Gift platform.

## What is OBS?

OBS (Open Broadcaster Software) is free, open-source software for video recording and live streaming. It's the most popular streaming software used by creators worldwide.

## Step 1: Download and Install OBS

1. Go to [https://obsproject.com](https://obsproject.com)
2. Download OBS Studio for your operating system
3. Install and launch OBS

## Step 2: Get Your Stream Credentials

1. Open the MS Gift app
2. Go to **Creator** → **Live Streaming** → **Create Stream**
3. Fill in your stream title and settings
4. After creating, you'll see:
   - **Server URL**: `rtmp://rtmp.livepeer.com/live`
   - **Stream Key**: Your unique key (keep this secret!)

## Step 3: Configure OBS Settings

### Open Settings
1. In OBS, click **Settings** (bottom right)

### Stream Settings
1. Go to **Stream** tab
2. Set **Service** to "Custom..."
3. Enter the **Server URL**: `rtmp://rtmp.livepeer.com/live`
4. Enter your **Stream Key** (from the app)

### Output Settings
1. Go to **Output** tab
2. Set **Output Mode** to "Simple" (or "Advanced" for more control)
3. **Video Bitrate**: 2500-4000 Kbps
   - Higher = better quality but needs better internet
   - Recommended: 2500 Kbps for most connections
4. **Audio Bitrate**: 128 Kbps

### Video Settings
1. Go to **Video** tab
2. **Base Resolution**: Match your monitor (e.g., 1920x1080)
3. **Output Resolution**: 1280x720 (720p) or 1920x1080 (1080p)
4. **FPS**: 30 (recommended) or 60

## Step 4: Set Up Your Scene

### Video Mode
If you're streaming with video:

1. Add a **Video Capture Device** source for your webcam
2. Resize and position as needed
3. Optional: Add overlays, text, images

### Audio-Only Mode
If you're streaming audio only:

1. Skip adding video sources
2. Make sure your microphone is set up:
   - Go to **Settings** → **Audio**
   - Select your microphone under "Mic/Auxiliary Audio"
3. Add an **Image** source with a static image or logo
4. The platform will show this image to viewers

### Avatar Mode
If you want to hide your face but show an image:

1. Add an **Image** source with your avatar
2. Make sure your microphone is set up
3. Position the avatar in the center

## Step 5: Test Your Setup

1. Click **Start Recording** to test locally
2. Check audio levels in the mixer
3. Stop recording and review the test file

## Step 6: Go Live!

1. In the MS Gift app, create a stream if you haven't already
2. In OBS, click **Start Streaming**
3. The app should automatically detect your stream
4. You're now live!

## Recommended Settings Summary

| Setting | Recommended Value |
|---------|------------------|
| Video Bitrate | 2500-4000 Kbps |
| Audio Bitrate | 128 Kbps |
| Resolution | 1280x720 (720p) |
| FPS | 30 |
| Encoder | x264 or NVENC |
| Keyframe Interval | 2 |

## Internet Speed Requirements

| Quality | Upload Speed Needed |
|---------|-------------------|
| 720p @ 30fps | 5 Mbps+ |
| 720p @ 60fps | 6 Mbps+ |
| 1080p @ 30fps | 8 Mbps+ |
| 1080p @ 60fps | 12 Mbps+ |

Test your upload speed at [speedtest.net](https://speedtest.net)

## Troubleshooting

### Stream Not Connecting
- Check your internet connection
- Verify the Server URL is correct
- Verify the Stream Key is correct (regenerate if needed)
- Try lowering your bitrate

### Stream Buffering for Viewers
- Lower your bitrate
- Switch to 720p instead of 1080p
- Check your upload speed

### No Audio
- Check microphone is selected in OBS Settings → Audio
- Make sure microphone isn't muted
- Check audio mixer levels in OBS

### Poor Video Quality
- Increase bitrate (if your internet allows)
- Use "Quality" preset instead of "Performance"
- Ensure good lighting

## Alternative: Mobile Streaming

If you don't have OBS, you can also stream from:
- **Streamlabs Mobile** (iOS/Android)
- **Larix Broadcaster** (iOS/Android)

Use the same Server URL and Stream Key.

## Security Tips

⚠️ **NEVER share your Stream Key!**

Your stream key is like a password. Anyone with it can stream to your channel.

If you accidentally share it:
1. Go to the app's streaming dashboard
2. Click "Regenerate Key"
3. Update OBS with the new key

## Advanced: Scene Switching

For professional streams, you can set up multiple scenes:

1. **Starting Soon** - Show before going live
2. **Main Scene** - Your camera/screen
3. **BRB Scene** - When you step away
4. **Ending Scene** - When stream ends

Switch between scenes using the scene list in OBS.

## Need Help?

- OBS Wiki: [obsproject.com/wiki](https://obsproject.com/wiki)
- OBS Forum: [obsproject.com/forum](https://obsproject.com/forum)
- Livepeer Docs: [docs.livepeer.org](https://docs.livepeer.org)

