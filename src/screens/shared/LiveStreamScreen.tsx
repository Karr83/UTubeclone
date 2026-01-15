/**
 * Live Stream Screen (Viewer)
 * 
 * YouTube-style mobile layout for watching live streams.
 * Features:
 * - Full-width video player at top
 * - Title + creator info row
 * - Live badge + viewer count
 * - Scrollable chat section below
 * 
 * Reuses existing logic from useStreamViewer hook and ChatContainer.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useStreamViewer } from '../../hooks/useStreamViewer';
import { ChatContainer } from '../../components/chat';

// =============================================================================
// TYPES
// =============================================================================

type StreamRouteParams = {
  LiveStream: {
    streamId: string;
  };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16); // 16:9 aspect ratio

// =============================================================================
// VIDEO PLAYER COMPONENT
// =============================================================================

interface VideoPlayerProps {
  playbackUrl: string;
  mode: 'video' | 'audio_only' | 'avatar';
  avatarUrl?: string;
  isLive: boolean;
}

function VideoPlayer({ playbackUrl, mode, avatarUrl, isLive }: VideoPlayerProps): JSX.Element {
  // Audio-only mode
  if (mode === 'audio_only') {
    return (
      <View style={playerStyles.container}>
        <View style={playerStyles.audioWrap}>
          <View style={playerStyles.audioIconCircle}>
            <Text style={playerStyles.audioIcon}>🎙️</Text>
          </View>
          <Text style={playerStyles.audioLabel}>Audio Only</Text>
          {isLive && (
            <View style={playerStyles.waveformMock}>
              {[...Array(12)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    playerStyles.waveBar, 
                    { height: 8 + Math.random() * 24 }
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Avatar mode (audio + static image)
  if (mode === 'avatar') {
    return (
      <View style={playerStyles.container}>
        <View style={playerStyles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={playerStyles.avatarImg} />
          ) : (
            <View style={playerStyles.avatarPlaceholder}>
              <Text style={playerStyles.avatarEmoji}>🎭</Text>
            </View>
          )}
          {isLive && (
            <View style={playerStyles.audioIndicator}>
              <Text style={playerStyles.audioIndicatorText}>♪ Audio playing</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Video mode (default)
  return (
    <View style={playerStyles.container}>
      {/* In production: Replace with expo-av or react-native-video */}
      <View style={playerStyles.videoPlaceholder}>
        <Text style={playerStyles.playIcon}>▶</Text>
        <Text style={playerStyles.devNote}>
          Video Player{'\n'}
          <Text style={playerStyles.devNoteSmall}>{playbackUrl?.substring(0, 40)}...</Text>
        </Text>
      </View>
      {/* 
        Production implementation:
        <Video
          source={{ uri: playbackUrl }}
          style={playerStyles.video}
          resizeMode="contain"
          shouldPlay
          useNativeControls
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
  videoPlaceholder: {
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
  audioWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  audioIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  audioIcon: {
    fontSize: 36,
  },
  audioLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  waveformMock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 3,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#ff0000',
    borderRadius: 2,
  },
  avatarWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  avatarImg: {
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
    marginTop: 12,
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  audioIndicatorText: {
    color: '#ff6b6b',
    fontSize: 12,
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LiveStreamScreen(): JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StreamRouteParams, 'LiveStream'>>();
  const streamId = route.params?.streamId;

  const {
    stream,
    isLoading,
    error,
    isLive,
    hasEnded,
    playbackUrl,
    viewerCount,
    joinStream,
    leaveStream,
    refresh,
  } = useStreamViewer();

  // Join stream on mount
  useEffect(() => {
    if (streamId) {
      joinStream(streamId);
    }
    return () => {
      leaveStream();
    };
  }, [streamId]);

  // ---------------------------------------------------------------------------
  // RENDER: LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#ff0000" />
          <Text style={styles.loadingText}>Loading stream...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: ERROR / ACCESS DENIED
  // ---------------------------------------------------------------------------

  if (error || !stream) {
    const isMembersOnly = error?.includes('members');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorIcon}>{isMembersOnly ? '🔒' : '⚠️'}</Text>
          <Text style={styles.errorTitle}>
            {isMembersOnly ? 'Members Only' : 'Stream Unavailable'}
          </Text>
          <Text style={styles.errorMsg}>
            {error || 'This stream could not be loaded.'}
          </Text>
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
  // RENDER: STREAM ENDED
  // ---------------------------------------------------------------------------

  if (hasEnded) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorIcon}>📺</Text>
          <Text style={styles.errorTitle}>Stream Ended</Text>
          <Text style={styles.errorMsg}>
            This stream has ended. Thanks for watching!
          </Text>
          <Text style={styles.statNote}>Peak viewers: {stream.peakViewerCount || 0}</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: WAITING / CONFIGURING
  // ---------------------------------------------------------------------------

  if (!isLive && stream.status === 'configuring') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.waitTitle}>Starting Soon</Text>
          <Text style={styles.waitStreamTitle}>{stream.title}</Text>
          <Text style={styles.waitHint}>The creator is setting up...</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
            <Text style={styles.refreshBtnText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: LIVE STREAM (MAIN VIEW)
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Video Player (fixed at top) */}
      <VideoPlayer
        playbackUrl={playbackUrl || ''}
        mode={stream.mode}
        avatarUrl={stream.avatarUrl}
        isLive={isLive}
      />

      {/* Scrollable content below player */}
      <ScrollView style={styles.scrollArea} bounces={false}>
        {/* Title + Meta Row */}
        <View style={styles.infoSection}>
          <Text style={styles.streamTitle} numberOfLines={2}>
            {stream.title}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {/* Live badge */}
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            <Text style={styles.viewerCount}>
              {viewerCount.toLocaleString()} watching
            </Text>

            <Text style={styles.visibilityBadge}>
              {stream.visibility === 'members' ? '🔒' : '🌐'}
            </Text>
          </View>

          {/* Creator row */}
          <TouchableOpacity 
            style={styles.creatorRow}
            onPress={() => {
              // Navigate to creator profile
              // @ts-ignore - navigation type
              navigation.navigate('CreatorProfile', { id: stream.creatorId });
            }}
          >
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>
                {stream.creatorName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{stream.creatorName || 'Creator'}</Text>
              <Text style={styles.creatorMeta}>
                {stream.mode === 'video' ? '📹 Video' : 
                 stream.mode === 'audio_only' ? '🎙️ Audio' : '🎭 Avatar'}
              </Text>
            </View>
            <TouchableOpacity style={styles.subscribeBtn}>
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Description (collapsible) */}
          {stream.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText} numberOfLines={3}>
                {stream.description}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Chat Section */}
        <View style={styles.chatSection}>
          <ChatContainer
            streamId={stream.id}
            streamCreatorId={stream.creatorId}
            isStreamLive={isLive}
            maxHeight={400}
          />
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
  
  // Center states (loading, error, ended)
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
  statNote: {
    color: '#666',
    fontSize: 12,
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
  
  // Waiting state
  waitTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  waitStreamTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  waitHint: {
    color: '#888',
    fontSize: 13,
    marginBottom: 20,
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
  streamTitle: {
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0000',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewerCount: {
    color: '#aaa',
    fontSize: 13,
    flex: 1,
  },
  visibilityBadge: {
    fontSize: 16,
  },

  // Creator row
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#272727',
    marginTop: 4,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  creatorMeta: {
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

  // Description
  descriptionBox: {
    backgroundColor: '#272727',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#272727',
    marginVertical: 8,
  },

  // Chat section
  chatSection: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
