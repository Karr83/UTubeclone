/**
 * Replay Screen (VOD Viewer)
 * 
 * YouTube-style mobile layout for watching recorded streams.
 * Features:
 * - Full-width video player at top with progress bar
 * - Title + creator info row
 * - View count + date info
 * - Description (expandable)
 * - Related videos section placeholder
 * 
 * Reuses existing logic from useReplayViewer hook.
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useReplayViewer } from '../../hooks/useReplayViewer';
import { formatDuration } from '../../services/recording.service';

// =============================================================================
// TYPES
// =============================================================================

type ReplayRouteParams = {
  Replay: {
    recordingId: string;
  };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16); // 16:9 aspect ratio

// =============================================================================
// VIDEO PLAYER COMPONENT
// =============================================================================

interface VideoPlayerProps {
  playbackUrl: string;
  duration: number;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
}

function VideoPlayer({ playbackUrl, duration, onProgress, onComplete }: VideoPlayerProps): JSX.Element {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock progress for demo
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={playerStyles.container}>
      {/* Video area */}
      <TouchableOpacity 
        style={playerStyles.videoArea}
        activeOpacity={0.9}
        onPress={() => setIsPlaying(!isPlaying)}
      >
        <Text style={playerStyles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        <Text style={playerStyles.devNote}>
          VOD Player{'\n'}
          <Text style={playerStyles.devNoteSmall}>{playbackUrl?.substring(0, 40)}...</Text>
        </Text>
      </TouchableOpacity>

      {/* Controls bar */}
      <View style={playerStyles.controlsBar}>
        {/* Progress bar */}
        <View style={playerStyles.progressTrack}>
          <View style={[playerStyles.progressFill, { width: `${progressPercent}%` }]} />
          <View style={[playerStyles.progressThumb, { left: `${progressPercent}%` }]} />
        </View>

        {/* Time */}
        <View style={playerStyles.timeRow}>
          <Text style={playerStyles.timeText}>{formatDuration(currentTime)}</Text>
          <Text style={playerStyles.timeText}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {/* 
        Production implementation:
        <Video
          source={{ uri: playbackUrl }}
          style={playerStyles.video}
          resizeMode="contain"
          useNativeControls
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setCurrentTime(Math.floor(status.positionMillis / 1000));
              if (status.didJustFinish) onComplete?.();
            }
          }}
        />
      */}
    </View>
  );
}

const playerStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#0f0f0f',
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 48,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  devNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  devNoteSmall: {
    fontSize: 9,
    color: '#444',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff0000',
    borderRadius: 1.5,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff0000',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ReplayScreen(): JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ReplayRouteParams, 'Replay'>>();
  const recordingId = route.params?.recordingId;

  const {
    recording,
    isLoading,
    error,
    playbackUrl,
    isAvailable,
    isProcessing,
    isUnavailable,
    permissionDenied,
    formattedDuration,
    formattedFileSize,
    loadRecording,
    trackView,
    updateProgress,
    clear,
  } = useReplayViewer();

  // Description expansion
  const [descExpanded, setDescExpanded] = useState(false);

  // Track if view has been counted
  const viewTracked = useRef(false);

  // Load recording on mount
  useEffect(() => {
    if (recordingId) {
      loadRecording(recordingId);
    }
    return () => {
      clear();
    };
  }, [recordingId]);

  // Track view when recording is available
  useEffect(() => {
    if (isAvailable && !viewTracked.current) {
      trackView();
      viewTracked.current = true;
    }
  }, [isAvailable, trackView]);

  // Handle progress updates
  const handleProgress = useCallback((seconds: number) => {
    updateProgress(seconds);
  }, [updateProgress]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (recording) {
      updateProgress(recording.durationSeconds, true);
    }
  }, [recording, updateProgress]);

  // Format relative date
  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // ---------------------------------------------------------------------------
  // RENDER: LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#ff0000" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: ERROR
  // ---------------------------------------------------------------------------

  if (error || !recording) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Video Not Found</Text>
          <Text style={styles.errorMsg}>
            {error || 'This video does not exist or has been removed.'}
          </Text>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: PERMISSION DENIED
  // ---------------------------------------------------------------------------

  if (permissionDenied) {
    const isMembersOnly = permissionDenied.includes('Upgrade');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorIcon}>{isMembersOnly ? '🔒' : '⛔'}</Text>
          <Text style={styles.errorTitle}>
            {isMembersOnly ? 'Members Only' : 'Access Denied'}
          </Text>
          <Text style={styles.errorMsg}>{permissionDenied}</Text>
          {isMembersOnly && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => {}}>
              <Text style={styles.upgradeBtnText}>Join Membership</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: PROCESSING
  // ---------------------------------------------------------------------------

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.processingTitle}>Video Processing</Text>
          <Text style={styles.processingText}>
            This video is being processed and will be available shortly.
          </Text>
          <View style={styles.processingCard}>
            <Text style={styles.processingCardTitle}>{recording.title}</Text>
            <Text style={styles.processingCardMeta}>by {recording.creatorName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={() => recordingId && loadRecording(recordingId)}
          >
            <Text style={styles.refreshBtnText}>↻ Check Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: UNAVAILABLE
  // ---------------------------------------------------------------------------

  if (isUnavailable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorIcon}>📼</Text>
          <Text style={styles.errorTitle}>Video Unavailable</Text>
          <Text style={styles.errorMsg}>
            {recording.isDeleted
              ? 'This video has been removed.'
              : recording.status === 'failed'
                ? 'This video failed to process.'
                : 'This video is no longer available.'}
          </Text>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: VOD PLAYER (MAIN VIEW)
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Video Player (fixed at top) */}
      {playbackUrl ? (
        <VideoPlayer
          playbackUrl={playbackUrl}
          duration={recording.durationSeconds || 0}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      ) : (
        <View style={[playerStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#888' }}>No playback URL available</Text>
        </View>
      )}

      {/* Scrollable content below player */}
      <ScrollView style={styles.scrollArea} bounces={false}>
        {/* Title + Meta */}
        <View style={styles.infoSection}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {recording.title}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Text style={styles.viewCount}>
              {(recording.viewCount || 0).toLocaleString()} views
            </Text>
            <Text style={styles.statDot}>•</Text>
            <Text style={styles.dateText}>
              {formatRelativeDate(recording.streamStartedAt)}
            </Text>
            <Text style={styles.visibilityIcon}>
              {recording.visibility === 'public' ? '🌐' : '🔒'}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>👍</Text>
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>👎</Text>
              <Text style={styles.actionText}>Dislike</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>⬇</Text>
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Creator row */}
        <TouchableOpacity
          style={styles.creatorRow}
          onPress={() => {
            // @ts-ignore - navigation type
            navigation.navigate('CreatorProfile', { id: recording.creatorId });
          }}
        >
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>
              {recording.creatorName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{recording.creatorName || 'Creator'}</Text>
            <Text style={styles.creatorSubs}>Tap to view channel</Text>
          </View>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description box */}
        <TouchableOpacity
          style={styles.descriptionBox}
          activeOpacity={0.8}
          onPress={() => setDescExpanded(!descExpanded)}
        >
          {/* Stats chips */}
          <View style={styles.descChips}>
            <View style={styles.descChip}>
              <Text style={styles.descChipText}>⏱ {formattedDuration}</Text>
            </View>
            {formattedFileSize && (
              <View style={styles.descChip}>
                <Text style={styles.descChipText}>📁 {formattedFileSize}</Text>
              </View>
            )}
            {recording.peakLiveViewers && (
              <View style={styles.descChip}>
                <Text style={styles.descChipText}>👁 {recording.peakLiveViewers} peak</Text>
              </View>
            )}
          </View>

          {/* Description text */}
          {recording.description ? (
            <Text 
              style={styles.descriptionText} 
              numberOfLines={descExpanded ? undefined : 3}
            >
              {recording.description}
            </Text>
          ) : (
            <Text style={styles.noDescription}>No description available</Text>
          )}

          {/* Expand/collapse */}
          <Text style={styles.expandText}>
            {descExpanded ? 'Show less' : 'Show more'}
          </Text>
        </TouchableOpacity>

        {/* Comments section placeholder */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>0</Text>
          </View>
          <View style={styles.commentsPlaceholder}>
            <Text style={styles.commentsPlaceholderIcon}>💬</Text>
            <Text style={styles.commentsPlaceholderText}>
              Comments coming soon
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  // Center states
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f0f0f',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMsg: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeBtn: {
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backLink: {
    paddingVertical: 12,
  },
  backLinkText: {
    color: '#3ea6ff',
    fontSize: 14,
  },

  // Processing state
  processingTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  processingCard: {
    backgroundColor: '#272727',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  processingCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  processingCardMeta: {
    color: '#aaa',
    fontSize: 14,
  },
  refreshBtn: {
    backgroundColor: '#272727',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 14,
  },

  // Main content
  scrollArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  // Info section
  infoSection: {
    padding: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewCount: {
    color: '#aaa',
    fontSize: 13,
  },
  statDot: {
    color: '#666',
    fontSize: 13,
    marginHorizontal: 6,
  },
  dateText: {
    color: '#aaa',
    fontSize: 13,
    flex: 1,
  },
  visibilityIcon: {
    fontSize: 14,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#272727',
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#272727',
  },

  // Creator row
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  creatorSubs: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  subscribeBtnText: {
    color: '#0f0f0f',
    fontSize: 14,
    fontWeight: '600',
  },

  // Description box
  descriptionBox: {
    backgroundColor: '#272727',
    margin: 12,
    borderRadius: 12,
    padding: 12,
  },
  descChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  descChip: {
    backgroundColor: '#3f3f3f',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  descChipText: {
    color: '#fff',
    fontSize: 12,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  noDescription: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  expandText: {
    color: '#3ea6ff',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },

  // Comments section
  commentsSection: {
    padding: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsCount: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 8,
  },
  commentsPlaceholder: {
    backgroundColor: '#272727',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  commentsPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  commentsPlaceholderText: {
    color: '#888',
    fontSize: 14,
  },
});
