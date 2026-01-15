/**
 * Live Streams List Screen
 * 
 * Displays all currently live streams in a YouTube-style mobile layout.
 * Reuses the same card pattern from ContentFeedScreen (Home).
 * 
 * FEATURES:
 * - Real-time list of live streams
 * - Filter chips (All, Public, Members)
 * - Pull to refresh
 * - Same visual style as Home feed
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { useMembership } from '../../contexts/MembershipContext';
import { Stream, StreamVisibility } from '../../types/streaming';
import {
  getLiveStreams,
  subscribeToLiveStreams,
} from '../../services/streaming.service';

// =============================================================================
// HELPER FUNCTIONS (same as ContentFeedScreen)
// =============================================================================

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// =============================================================================
// STREAM CARD COMPONENT
// =============================================================================

interface StreamCardProps {
  stream: Stream;
  onPress: () => void;
  onPressCreator: () => void;
  canView: boolean;
}

function StreamCard({ stream, onPress, onPressCreator, canView }: StreamCardProps): JSX.Element {
  const avatarLetter = useMemo(() => {
    return (stream.creatorName?.[0] || stream.creatorId?.[0] || '?').toUpperCase();
  }, [stream.creatorName, stream.creatorId]);

  return (
    <View style={styles.ytCard}>
      {/* Thumbnail */}
      <TouchableOpacity 
        activeOpacity={0.85} 
        onPress={onPress}
        disabled={!canView}
      >
        <View style={styles.ytThumbWrap}>
          {stream.thumbnailUrl ? (
            <Image
              source={{ uri: stream.thumbnailUrl }}
              style={styles.ytThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.ytThumbFallback}>
              <Text style={styles.ytThumbEmoji}>
                {stream.mode === 'audio_only' ? '🎙️' : 
                 stream.mode === 'avatar' ? '🎭' : '📹'}
              </Text>
            </View>
          )}

          {/* LIVE Badge (top-left) */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          {/* Viewer count (bottom-right) */}
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerText}>
              {formatCount(stream.viewerCount || 0)} watching
            </Text>
          </View>

          {/* Members badge (top-right) */}
          {stream.visibility === 'members' && (
            <View style={styles.ytBadgeTopRight}>
              <Text style={styles.ytBadgeText}>🔒 Members</Text>
            </View>
          )}

          {/* Locked overlay */}
          {!canView && stream.visibility === 'members' && (
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedText}>Join to watch</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Meta row */}
      <View style={styles.ytMetaRow}>
        <TouchableOpacity
          style={styles.ytAvatar}
          onPress={onPressCreator}
          activeOpacity={0.85}
        >
          <Text style={styles.ytAvatarText}>{avatarLetter}</Text>
        </TouchableOpacity>

        <View style={styles.ytTextCol}>
          <Text style={styles.ytTitle} numberOfLines={2}>
            {stream.title}
          </Text>
          <Text style={styles.ytSub} numberOfLines={1}>
            {stream.creatorName || stream.creatorId?.slice(0, 8)} •{' '}
            {stream.mode === 'audio_only' ? '🎙️ Audio' : 
             stream.mode === 'avatar' ? '🎭 Avatar' : '📹 Video'}
          </Text>
        </View>

        <View style={styles.ytKebab}>
          <Text style={styles.ytKebabText}>⋮</Text>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LiveStreamsListScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { tier } = useMembership();

  // State
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'members'>('all');

  // Load streams
  const loadStreams = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else if (streams.length === 0) {
      setIsLoading(true);
    }

    try {
      const visibility = filter === 'all' ? undefined : filter as StreamVisibility;
      const result = await getLiveStreams({ visibility });
      setStreams(result.streams);
    } catch (error) {
      console.error('[LiveStreamsListScreen] Load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, streams.length]);

  // Initial load and subscribe to updates
  useEffect(() => {
    loadStreams();

    // Subscribe to real-time updates
    const visibility = filter === 'all' ? undefined : filter as StreamVisibility;
    const unsubscribe = subscribeToLiveStreams((updatedStreams) => {
      setStreams(updatedStreams);
    }, visibility);

    return () => unsubscribe();
  }, [filter]);

  // Check if user can view a stream
  const canViewStream = useCallback((stream: Stream): boolean => {
    if (stream.visibility === 'public') return true;
    if (!user) return false;
    return tier !== 'free';
  }, [user, tier]);

  // Navigate to stream
  const handleStreamPress = (stream: Stream) => {
    if (!canViewStream(stream)) {
      navigation.navigate('Upgrade');
      return;
    }
    navigation.navigate('LiveStream', { streamId: stream.id });
  };

  // Navigate to creator profile
  const handleCreatorPress = (creatorId: string) => {
    navigation.navigate('CreatorProfile', { id: creatorId });
  };

  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------

  if (isLoading && streams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff0000" />
          <Text style={styles.loadingText}>Finding live streams...</Text>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: EMPTY STATE
  // ---------------------------------------------------------------------------

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📺</Text>
      <Text style={styles.emptyTitle}>No Live Streams</Text>
      <Text style={styles.emptyText}>
        {filter === 'members'
          ? 'No members-only streams are live right now.'
          : 'No creators are live right now. Check back later!'}
      </Text>
    </View>
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveIndicatorDot} />
          </View>
          <Text style={styles.brand}>Live</Text>
        </View>
        <Text style={styles.streamCount}>
          {streams.length} {streams.length === 1 ? 'stream' : 'streams'}
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {(['all', 'public', 'members'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f === 'all' ? 'All' : f === 'public' ? 'Public' : '🔒 Members'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stream List */}
      <FlatList
        data={streams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StreamCard
            stream={item}
            onPress={() => handleStreamPress(item)}
            onPressCreator={() => handleCreatorPress(item.creatorId)}
            canView={canViewStream(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStreams(true)}
            tintColor="#ff0000"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// =============================================================================
// STYLES (matching ContentFeedScreen dark YouTube theme)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },

  // Top Bar
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#0B0B0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streamCount: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  // Chips (filter tabs)
  chipsWrap: {
    backgroundColor: '#0B0B0B',
    paddingBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#1F2937',
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#111827',
  },

  // List
  listContent: {
    paddingBottom: 24,
  },

  // YouTube-style card (matching ContentFeedScreen)
  ytCard: {
    marginBottom: 16,
  },
  ytThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#111827',
    position: 'relative',
  },
  ytThumb: {
    width: '100%',
    height: '100%',
  },
  ytThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytThumbEmoji: {
    fontSize: 48,
  },

  // LIVE badge
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Viewer count badge
  viewerBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  viewerText: {
    color: '#fff',
    fontSize: 12,
  },

  // Members badge (top-right)
  ytBadgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ytBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Locked overlay
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  lockedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Meta row (matching ContentFeedScreen)
  ytMetaRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ytAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ytTextCol: {
    flex: 1,
  },
  ytTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  ytSub: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  ytKebab: {
    width: 24,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  ytKebabText: {
    color: '#9CA3AF',
    fontSize: 18,
    lineHeight: 18,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
