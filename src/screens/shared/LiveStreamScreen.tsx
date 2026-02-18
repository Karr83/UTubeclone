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

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useStreamViewer } from '../../hooks/useStreamViewer';
import { useAuth } from '../../contexts/AuthContext';
import { ChatContainer } from '../../components/chat';
import { VideoDescription, VideoPlayer, VideoPageIconsDropdown, VideoPageMoreIcon, VideoPageSaveIcon, VideoPageShareIcon, VideoPageDislikeIcon, VideoPageLikeIcon, createVideoMenuItems } from '../../components/video';
import {
  getUserReaction,
  isItemSaved,
  isSubscribedToCreator,
  setUserReaction,
  submitInteractionReport,
  toggleSavedItem,
  toggleCreatorSubscription,
} from '../../services/interaction.service';

// =============================================================================
// TYPES
// =============================================================================

type StreamRouteParams = {
  LiveStream: {
    streamId: string;
  };
};


// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LiveStreamScreen(): JSX.Element {
  const navigation = useNavigation();
  const { user } = useAuth();
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

  // Dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Saved state
  const [isSaved, setIsSaved] = useState(false);
  // Liked state
  const [isLiked, setIsLiked] = useState(false);
  // Disliked state
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleShare = async (): Promise<void> => {
    if (!stream) return;
    try {
      await Share.share({
        message: `Watch "${stream.title}" live on VibeTube`,
      });
    } catch (err: any) {
      Alert.alert('Share failed', err?.message || 'Could not open share dialog.');
    }
  };

  const requireAuth = (): boolean => {
    if (!user?.uid) {
      Alert.alert('Sign in required', 'Please sign in to use this action.');
      return false;
    }
    return true;
  };

  // Join stream on mount
  useEffect(() => {
    if (streamId) {
      joinStream(streamId);
    }
    return () => {
      leaveStream();
    };
  }, [streamId]);

  useEffect(() => {
    let isActive = true;

    const loadInteractions = async () => {
      if (!stream || !user?.uid) {
        if (isActive) {
          setIsLiked(false);
          setIsDisliked(false);
          setIsSubscribed(false);
        }
        return;
      }

      try {
        const [reaction, subscribed, saved] = await Promise.all([
          getUserReaction('streams', stream.id, user.uid),
          isSubscribedToCreator(user.uid, stream.creatorId),
          isItemSaved(user.uid, 'stream', stream.id),
        ]);

        if (isActive) {
          setIsLiked(reaction === 'like');
          setIsDisliked(reaction === 'dislike');
          setIsSubscribed(subscribed);
          setIsSaved(saved);
        }
      } catch (err) {
        console.error('[LiveStreamScreen] Failed to load interactions:', err);
      }
    };

    loadInteractions();
    return () => {
      isActive = false;
    };
  }, [stream?.id, stream?.creatorId, user?.uid]);

  const handleLike = async (): Promise<void> => {
    if (!stream || !requireAuth()) return;

    try {
      const reaction = await setUserReaction('streams', stream.id, user!.uid, 'like');
      setIsLiked(reaction === 'like');
      setIsDisliked(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reaction.');
    }
  };

  const handleDislike = async (): Promise<void> => {
    if (!stream || !requireAuth()) return;

    try {
      const reaction = await setUserReaction('streams', stream.id, user!.uid, 'dislike');
      setIsDisliked(reaction === 'dislike');
      setIsLiked(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reaction.');
    }
  };

  const handleSubscribe = async (): Promise<void> => {
    if (!stream || !requireAuth()) return;

    try {
      const subscribed = await toggleCreatorSubscription(user!.uid, stream.creatorId);
      setIsSubscribed(subscribed);
      Alert.alert('Subscription', subscribed ? 'Subscribed to creator.' : 'Unsubscribed from creator.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update subscription.');
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!stream || !requireAuth()) return;
    try {
      const saved = await toggleSavedItem(user!.uid, 'stream', stream.id);
      setIsSaved(saved);
      Alert.alert('Saved', saved ? 'Stream saved to your library.' : 'Stream removed from saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update saved state.');
    }
  };

  const handleReport = async (): Promise<void> => {
    if (!stream || !requireAuth()) return;
    try {
      await submitInteractionReport(user!.uid, {
        targetType: 'stream',
        targetId: stream.id,
        reason: 'user_report',
        details: `Reported from live screen: ${stream.title}`,
      });
      Alert.alert('Report submitted', 'Thanks, we will review this stream.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit report.');
    }
  };

  // Create menu items for the dropdown
  const menuItems = createVideoMenuItems({
    onSaveToPlaylist: handleSave,
    onShare: handleShare,
    onNotInterested: () => {
      Alert.alert('Feedback saved', 'We will show fewer streams like this.');
      navigation.goBack();
    },
    onReport: handleReport,
  });

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
            <TouchableOpacity 
              style={styles.upgradeBtn} 
              onPress={() => navigation.navigate('Upgrade')}
            >
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
        videoUrl={playbackUrl || ''}
        title={stream.title}
        mode={stream.mode}
        avatarUrl={stream.avatarUrl}
        isLive={true}
        isPlaying={isLive}
        viewerCount={viewerCount}
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

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <View style={styles.actionBtn}>
              <View style={{ marginBottom: 4 }}>
                <VideoPageLikeIcon
                  liked={isLiked}
                  onPress={handleLike}
                  size={24}
                />
              </View>
              <Text style={styles.actionText}>Like</Text>
            </View>
            <View style={styles.actionBtn}>
              <View style={{ marginBottom: 4 }}>
                <VideoPageDislikeIcon
                  disliked={isDisliked}
                  onPress={handleDislike}
                  size={24}
                />
              </View>
              <Text style={styles.actionText}>Dislike</Text>
            </View>
            <View style={styles.actionBtn}>
              <View style={{ marginBottom: 4 }}>
                <VideoPageShareIcon
                  onPress={handleShare}
                  size={24}
                />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </View>
            <View style={styles.actionBtn}>
              <View style={{ marginBottom: 4 }}>
                <VideoPageSaveIcon
                  saved={isSaved}
                  onPress={handleSave}
                  size={24}
                />
              </View>
              <Text style={styles.actionText}>Save</Text>
            </View>
            <View style={styles.actionBtn}>
              <View style={{ marginBottom: 4 }}>
                <VideoPageMoreIcon
                  onPress={() => setIsMenuOpen(true)}
                  size={24}
                />
              </View>
              <Text style={styles.actionText}>More</Text>
            </View>
          </View>

          {/* Creator + Description Section */}
          <VideoDescription
            viewCount={viewerCount}
            description={stream.description}
            creatorName={stream.creatorName || 'Creator'}
            subscriberCount="1.2M"
            onCreatorPress={() => {
              // @ts-ignore - navigation type
              navigation.navigate('CreatorProfile', { id: stream.creatorId });
            }}
            onSubscribePress={() => {
              handleSubscribe();
            }}
            isSubscribed={isSubscribed}
          />
        </View>

        {/* Dropdown Menu */}
        <VideoPageIconsDropdown
          items={menuItems}
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          anchorPosition="top-right"
        />

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

  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
    marginBottom: 8,
  },
  actionBtn: {
    alignItems: 'center',
    minWidth: 60,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});
