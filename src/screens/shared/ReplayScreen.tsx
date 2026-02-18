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
  ScrollView,
  StatusBar,
  Alert,
  Share,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useReplayViewer } from '../../hooks/useReplayViewer';
import { useAuth } from '../../contexts/AuthContext';
import { formatDuration } from '../../services/recording.service';
import { CommentItem } from '../../components/comment';
import { VideoDescription, VideoPlayer, VideoPageIconsDropdown, VideoPageMoreIcon, VideoPageSaveIcon, VideoPageShareIcon, VideoPageDislikeIcon, VideoPageLikeIcon, createVideoMenuItems } from '../../components/video';
import {
  addRecordingComment,
  getUserReaction,
  isItemSaved,
  isSubscribedToCreator,
  setUserReaction,
  subscribeToRecordingComments,
  submitInteractionReport,
  toggleSavedItem,
  toggleCreatorSubscription,
} from '../../services/interaction.service';

// =============================================================================
// TYPES
// =============================================================================

type ReplayRouteParams = {
  Replay: {
    recordingId: string;
  };
};

// =============================================================================
// MOCK COMMENTS DATA (UI Only)
// =============================================================================

const INITIAL_COMMENTS: Array<{
  id: string;
  username: string;
  avatarUrl: string | undefined;
  userRole: 'viewer' | 'member' | 'creator' | 'admin';
  text: string;
  timestamp: string | Date;
  likeCount: number;
  replyCount: number;
}> = [];


// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ReplayScreen(): JSX.Element {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
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

  // Dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Saved state
  const [isSaved, setIsSaved] = useState(false);
  // Liked state
  const [isLiked, setIsLiked] = useState(false);
  // Disliked state
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentReactions, setCommentReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});

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

  const requireAuth = (): boolean => {
    if (!user?.uid) {
      Alert.alert('Sign in required', 'Please sign in to use this action.');
      return false;
    }
    return true;
  };

  const handleShare = useCallback(async () => {
    if (!recording) return;
    try {
      await Share.share({
        message: `Watch "${recording.title}" on VibeTube`,
      });
    } catch (err: any) {
      Alert.alert('Share failed', err?.message || 'Could not open share dialog.');
    }
  }, [recording]);

  const submitComment = useCallback(async () => {
    if (!recording) return;
    if (!requireAuth()) return;

    if (!newCommentText.trim()) {
      Alert.alert('Comment required', 'Please type your comment first.');
      return;
    }

    try {
      await addRecordingComment(
        recording.id,
        user!.uid,
        profile?.displayName || profile?.email || 'User',
        newCommentText,
        profile?.role === 'admin'
          ? 'admin'
          : profile?.role === 'creator'
            ? 'creator'
            : 'viewer'
      );
      setNewCommentText('');
      setShowCommentModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to post comment.');
    }
  }, [newCommentText, recording?.id, user?.uid, profile?.displayName, profile?.email, profile?.role]);

  useEffect(() => {
    if (!recording?.id) {
      setComments([]);
      return;
    }

    const unsubscribe = subscribeToRecordingComments(recording.id, (nextComments) => {
      setComments(
        nextComments.map((comment) => ({
          id: comment.id,
          username: comment.username,
          avatarUrl: undefined,
          userRole: comment.userRole,
          text: comment.text,
          timestamp: comment.createdAt,
          likeCount: comment.likeCount,
          replyCount: comment.replyCount,
        }))
      );
    });

    return () => unsubscribe();
  }, [recording?.id]);

  useEffect(() => {
    let isActive = true;

    const loadInteractions = async () => {
      if (!recording || !user?.uid) {
        if (isActive) {
          setIsLiked(false);
          setIsDisliked(false);
          setIsSubscribed(false);
        }
        return;
      }

      try {
        const [reaction, subscribed, saved] = await Promise.all([
          getUserReaction('recordings', recording.id, user.uid),
          isSubscribedToCreator(user.uid, recording.creatorId),
          isItemSaved(user.uid, 'recording', recording.id),
        ]);

        if (isActive) {
          setIsLiked(reaction === 'like');
          setIsDisliked(reaction === 'dislike');
          setIsSubscribed(subscribed);
          setIsSaved(saved);
        }
      } catch (err) {
        console.error('[ReplayScreen] Failed to load interactions:', err);
      }
    };

    loadInteractions();
    return () => {
      isActive = false;
    };
  }, [recording?.id, recording?.creatorId, user?.uid]);

  const handleLike = useCallback(async () => {
    if (!recording || !requireAuth()) return;

    try {
      const reaction = await setUserReaction('recordings', recording.id, user!.uid, 'like');
      setIsLiked(reaction === 'like');
      setIsDisliked(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reaction.');
    }
  }, [recording?.id, user?.uid]);

  const handleDislike = useCallback(async () => {
    if (!recording || !requireAuth()) return;

    try {
      const reaction = await setUserReaction('recordings', recording.id, user!.uid, 'dislike');
      setIsDisliked(reaction === 'dislike');
      setIsLiked(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reaction.');
    }
  }, [recording?.id, user?.uid]);

  const handleSubscribe = useCallback(async () => {
    if (!recording || !requireAuth()) return;

    try {
      const subscribed = await toggleCreatorSubscription(user!.uid, recording.creatorId);
      setIsSubscribed(subscribed);
      Alert.alert('Subscription', subscribed ? 'Subscribed to creator.' : 'Unsubscribed from creator.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update subscription.');
    }
  }, [recording?.id, recording?.creatorId, user?.uid]);

  const handleSave = useCallback(async () => {
    if (!recording || !requireAuth()) return;

    try {
      const saved = await toggleSavedItem(user!.uid, 'recording', recording.id);
      setIsSaved(saved);
      Alert.alert('Saved', saved ? 'Video saved to your library.' : 'Video removed from saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update saved state.');
    }
  }, [recording?.id, user?.uid]);

  const handleReport = useCallback(async () => {
    if (!recording || !requireAuth()) return;

    try {
      await submitInteractionReport(user!.uid, {
        targetType: 'recording',
        targetId: recording.id,
        reason: 'user_report',
        details: `Reported from replay screen: ${recording.title}`,
      });
      Alert.alert('Report submitted', 'Thanks, we will review this video.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit report.');
    }
  }, [recording?.id, recording?.title, user?.uid]);

  const handleCommentLike = useCallback((commentId: string) => {
    setCommentReactions((prev) => {
      const current = prev[commentId] || null;
      return { ...prev, [commentId]: current === 'like' ? null : 'like' };
    });

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        const existing = commentReactions[commentId] || null;
        const nextCount = existing === 'like'
          ? Math.max(0, comment.likeCount - 1)
          : comment.likeCount + 1;
        return { ...comment, likeCount: nextCount };
      })
    );
  }, [commentReactions]);

  const handleCommentDislike = useCallback((commentId: string) => {
    setCommentReactions((prev) => {
      const current = prev[commentId] || null;
      return { ...prev, [commentId]: current === 'dislike' ? null : 'dislike' };
    });
  }, []);

  const handleCommentReply = useCallback((commentUsername: string) => {
    setNewCommentText(`@${commentUsername} `);
    setShowCommentModal(true);
  }, []);

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

  // Create menu items for the dropdown
  const menuItems = createVideoMenuItems({
    onSaveToPlaylist: handleSave,
    onDownload: async () => {
      if (!playbackUrl) return;
      const canOpen = await Linking.canOpenURL(playbackUrl);
      if (!canOpen) {
        Alert.alert('Download unavailable', 'Could not open the video URL.');
        return;
      }
      await Linking.openURL(playbackUrl);
    },
    onShare: handleShare,
    onNotInterested: () => {
      Alert.alert('Feedback saved', 'We will show fewer videos like this.');
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
      <VideoPlayer
        videoUrl={playbackUrl || ''}
        thumbnailUrl={recording.thumbnailUrl}
        title={recording.title}
        duration={recording.durationSeconds || 0}
        isLive={false}
        onPlayPause={() => {}}
      />

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
        </View>

        {/* Dropdown Menu */}
        <VideoPageIconsDropdown
          items={menuItems}
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          anchorPosition="top-right"
        />

        {/* Creator + Description Section */}
        <VideoDescription
          viewCount={recording.viewCount || 0}
          uploadDate={recording.streamStartedAt}
          description={recording.description}
          creatorName={recording.creatorName || 'Creator'}
          subscriberCount="1.2M"
          onCreatorPress={() => {
            // @ts-ignore - navigation type
            navigation.navigate('CreatorProfile', { id: recording.creatorId });
          }}
          onSubscribePress={() => {
            handleSubscribe();
          }}
          isSubscribed={isSubscribed}
        />

        {/* Comments section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>{comments.length}</Text>
            <TouchableOpacity style={styles.commentsSortButton}>
              <Text style={styles.commentsSortText}>⇅ Sort by</Text>
            </TouchableOpacity>
          </View>
          
          {/* Comment input prompt */}
          <TouchableOpacity style={styles.commentInputPrompt} onPress={() => setShowCommentModal(true)}>
            <View style={styles.commentInputAvatar}>
              <Text style={styles.commentInputAvatarText}>👤</Text>
            </View>
            <Text style={styles.commentInputPlaceholder}>Add a comment...</Text>
          </TouchableOpacity>
          
          {/* Comments list */}
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              mode="vod"
              avatarUrl={comment.avatarUrl}
              username={comment.username}
              userRole={comment.userRole}
              text={comment.text}
              timestamp={comment.timestamp}
              likeCount={comment.likeCount}
              replyCount={comment.replyCount}
              showActions={true}
              onLike={() => handleCommentLike(comment.id)}
              onDislike={() => handleCommentDislike(comment.id)}
              onReply={() => handleCommentReply(comment.username)}
            />
          ))}
          
          {/* Load more comments */}
          <TouchableOpacity style={styles.loadMoreComments}>
            <Text style={styles.loadMoreText}>Show more comments</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showCommentModal}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.commentModalOverlay}>
          <View style={styles.commentModalCard}>
            <Text style={styles.commentModalTitle}>Add a comment</Text>
            <TextInput
              style={styles.commentModalInput}
              value={newCommentText}
              onChangeText={setNewCommentText}
              placeholder="Type your comment..."
              placeholderTextColor="#8A8A8A"
              multiline
            />
            <View style={styles.commentModalActions}>
              <TouchableOpacity style={styles.commentModalSecondaryBtn} onPress={() => setShowCommentModal(false)}>
                <Text style={styles.commentModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commentModalPrimaryBtn} onPress={submitComment}>
                <Text style={styles.commentModalBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Comments section
  commentsSection: {
    paddingTop: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    flex: 1,
  },
  commentsSortButton: {
    padding: 4,
  },
  commentsSortText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  commentInputPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
    marginBottom: 8,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputAvatarText: {
    fontSize: 18,
  },
  commentInputPlaceholder: {
    marginLeft: 12,
    color: '#888',
    fontSize: 14,
  },
  loadMoreComments: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#3ea6ff',
    fontSize: 14,
    fontWeight: '500',
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  commentModalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  commentModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  commentModalInput: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    color: '#fff',
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  commentModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  commentModalPrimaryBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 84,
    alignItems: 'center',
    paddingVertical: 10,
  },
  commentModalSecondaryBtn: {
    backgroundColor: '#272727',
    borderRadius: 8,
    minWidth: 84,
    alignItems: 'center',
    paddingVertical: 10,
  },
  commentModalBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
