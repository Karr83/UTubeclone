/**
 * VideoPlayer Component
 * 
 * Reusable video player UI based on Figma design.
 * Supports both live streams and VOD playback.
 * 
 * Features:
 * - Dark gradient background (YouTube-style)
 * - Centered play/pause overlay button
 * - Live indicator (when isLive === true)
 * - Progress bar (only for replay/VOD)
 * - Fullscreen icon
 * - Dark gradient overlay behind controls
 * 
 * Note: Actual video playback requires expo-av or react-native-video integration.
 * This component provides the UI shell.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export type VideoSource = {
  uri: string;
  type?: 'video' | 'audio' | 'stream';
};

export type VideoPlayerMode = 'video' | 'audio_only' | 'avatar';

export interface VideoPlayerProps {
  /** Video source (URL or object) */
  source?: VideoSource | string;
  /** Thumbnail image URL */
  thumbnailUrl?: string;
  /** Video/stream title (shown in overlay) */
  title?: string;
  /** Total duration in seconds (VOD only) */
  duration?: number;
  /** Current playback time in seconds */
  currentTime?: number;
  
  // State
  /** Is this a live stream */
  isLive?: boolean;
  /** Is video currently paused */
  paused?: boolean;
  /** Auto-play on load */
  autoPlay?: boolean;
  /** Special display mode for streams */
  mode?: VideoPlayerMode;
  /** Avatar URL for avatar mode */
  avatarUrl?: string;
  /** Live viewer count */
  viewerCount?: number;
  
  // Callbacks
  /** Called when play/pause toggled */
  onPlayPause?: () => void;
  /** Called when fullscreen tapped */
  onFullscreen?: () => void;
  /** Called when info button tapped */
  onInfoPress?: () => void;
  
  // Legacy support (for existing usage)
  /** Legacy: Video/stream playback URL */
  videoUrl?: string;
  /** Legacy: Is video currently playing */
  isPlaying?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// AUDIO ONLY MODE
// =============================================================================

interface AudioModeProps {
  isLive?: boolean;
}

function AudioOnlyMode({ isLive }: AudioModeProps): JSX.Element {
  return (
    <View style={styles.specialModeContainer}>
      <View style={styles.audioIconCircle}>
        <Text style={styles.audioIcon}>🎙️</Text>
      </View>
      <Text style={styles.modeLabel}>Audio Only</Text>
      {isLive && (
        <View style={styles.waveformContainer}>
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height: 8 + Math.random() * 24 }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// AVATAR MODE
// =============================================================================

interface AvatarModeProps {
  avatarUrl?: string;
  isLive?: boolean;
}

function AvatarMode({ avatarUrl, isLive }: AvatarModeProps): JSX.Element {
  return (
    <View style={styles.specialModeContainer}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>🎭</Text>
        </View>
      )}
      {isLive && (
        <View style={styles.audioIndicator}>
          <Text style={styles.audioIndicatorText}>♪ Audio playing</Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VideoPlayer({
  source,
  thumbnailUrl,
  title,
  duration = 0,
  currentTime = 0,
  isLive = false,
  paused = false,
  autoPlay = false,
  mode = 'video',
  avatarUrl,
  viewerCount,
  onPlayPause,
  onFullscreen,
  onInfoPress,
  // Legacy support
  videoUrl,
  isPlaying,
}: VideoPlayerProps): JSX.Element {
  const [showControls, setShowControls] = useState(true);
  
  // Support legacy props
  const actualVideoUrl = typeof source === 'string' ? source : source?.uri || videoUrl || '';
  const actualPaused = isPlaying !== undefined ? !isPlaying : paused;
  
  // Calculate progress percentages (only for VOD)
  const playProgress = !isLive && duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (onPlayPause) {
      onPlayPause();
    }
  }, [onPlayPause]);
  
  // Toggle controls visibility
  const handleVideoPress = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);
  
  // Render special modes
  if (mode === 'audio_only') {
    return (
      <View style={styles.container}>
        <AudioOnlyMode isLive={isLive} />
        {isLive && <LiveBadge viewerCount={viewerCount} />}
      </View>
    );
  }
  
  if (mode === 'avatar') {
    return (
      <View style={styles.container}>
        <AvatarMode avatarUrl={avatarUrl} isLive={isLive} />
        {isLive && <LiveBadge viewerCount={viewerCount} />}
      </View>
    );
  }
  
  // Video mode (default)
  return (
    <View style={styles.container}>
      {/* Video Area */}
      <TouchableOpacity
        style={styles.videoArea}
        activeOpacity={1}
        onPress={handleVideoPress}
      >
        {/* Thumbnail/Background */}
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderBackground} />
        )}
        
        {/* Title Overlay (top) */}
        {showControls && title && (
          <View style={styles.titleOverlay}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
              <View style={styles.infoCircle}>
                <Text style={styles.infoIcon}>i</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Dark Gradient Overlay (behind controls) */}
        {showControls && (
          <View style={styles.gradientOverlay} />
        )}
        
        {/* Center Play/Pause Button */}
        {showControls && (
          <TouchableOpacity
            style={styles.centerPlayContainer}
            onPress={handlePlayPause}
            activeOpacity={0.9}
          >
            <View style={styles.centerPlayButton}>
              <Text style={styles.centerPlayIcon}>
                {actualPaused ? '▶' : '⏸'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Live Badge (only when isLive === true) */}
        {isLive && showControls && (
          <LiveBadge viewerCount={viewerCount} />
        )}
        
        {/* Fullscreen Icon */}
        {showControls && (
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={onFullscreen}
            activeOpacity={0.7}
          >
            <Text style={styles.fullscreenIcon}>⛶</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {/* Progress Bar (only for replay/VOD, not live) */}
      {!isLive && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${playProgress}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// LIVE BADGE COMPONENT
// =============================================================================

interface LiveBadgeProps {
  viewerCount?: number;
}

function LiveBadge({ viewerCount }: LiveBadgeProps): JSX.Element {
  return (
    <View style={styles.liveBadgeContainer}>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      {viewerCount !== undefined && (
        <Text style={styles.viewerCountText}>
          {viewerCount.toLocaleString()} watching
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  
  // Video Area
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBackground: {
    flex: 1,
    backgroundColor: '#0A1929',
    // Gradient effect approximation
  },
  
  // Title Overlay
  titleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  titleText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium as any,
    color: '#FFF',
    marginRight: spacing[2],
  },
  infoButton: {
    padding: spacing[1],
  },
  infoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Center Play Button
  centerPlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: darkTheme.youtube.red,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  centerPlayIcon: {
    fontSize: 36,
    color: '#FFF',
    marginLeft: 4,
  },
  
  // Dark Gradient Overlay (approximated with opacity)
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  // Fullscreen Button
  fullscreenButton: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  
  // Progress Bar (only for VOD)
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressTrack: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: darkTheme.youtube.red,
    left: 0,
    top: 0,
  },
  
  // Live Badge
  liveBadgeContainer: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.red,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  viewerCountText: {
    fontSize: 12,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  
  // Special Modes (Audio/Avatar)
  specialModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  audioIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  audioIcon: {
    fontSize: 36,
  },
  modeLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium as any,
    color: '#FFF',
    marginBottom: spacing[4],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 3,
  },
  waveBar: {
    width: 4,
    backgroundColor: darkTheme.youtube.red,
    borderRadius: 2,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 56,
  },
  audioIndicator: {
    marginTop: spacing[3],
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 12,
  },
  audioIndicatorText: {
    fontSize: typography.fontSize.sm,
    color: '#FF6B6B',
  },
});
