/**
 * Live Streams List Screen
 * 
 * Displays all currently live streams.
 * Uses the unified VideoCard component with "live" variant.
 * 
 * FEATURES:
 * - Real-time list of live streams
 * - Filter chips (All, Public, Members)
 * - Pull to refresh
 * - Auto-updates via subscription
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
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
import { VideoCard } from '../../components/video';
import { darkTheme } from '../../theme';

// =============================================================================
// MOCK DATA (for demo when Firebase is offline)
// =============================================================================

// Mock creator names map
const MOCK_CREATOR_NAMES: Record<string, string> = {
  'creator-1': 'Tech Guru',
  'creator-2': 'Code Master',
  'creator-3': 'Dev Expert',
};

const MOCK_STREAMS: Stream[] = [
  {
    id: 'mock-stream-1',
    creatorId: 'creator-1',
    title: 'Live Coding: Building a React Native App',
    description: 'Join me as I build a complete React Native app from scratch',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Live+1',
    status: 'live',
    visibility: 'public',
    mode: 'video',
    playbackUrl: 'https://example.com/stream1.m3u8',
    streamKey: 'mock-key-1',
    rtmpUrl: 'rtmp://example.com/live',
    viewerCount: 1250,
    peakViewers: 2500,
    startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: 'mock-stream-2',
    creatorId: 'creator-2',
    title: 'TypeScript Tips & Tricks - Live Q&A',
    description: 'Ask me anything about TypeScript!',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Live+2',
    status: 'live',
    visibility: 'public',
    mode: 'video',
    playbackUrl: 'https://example.com/stream2.m3u8',
    streamKey: 'mock-key-2',
    rtmpUrl: 'rtmp://example.com/live',
    viewerCount: 890,
    peakViewers: 1200,
    startedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: 'mock-stream-3',
    creatorId: 'creator-3',
    title: 'Firebase Tutorial - Real-time Database',
    description: 'Learn how to use Firebase Realtime Database',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/00AA00/FFFFFF?text=Live+3',
    status: 'live',
    visibility: 'members',
    mode: 'video',
    playbackUrl: 'https://example.com/stream3.m3u8',
    streamKey: 'mock-key-3',
    rtmpUrl: 'rtmp://example.com/live',
    viewerCount: 450,
    peakViewers: 600,
    startedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

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

  // ---------------------------------------------------------------------------
  // LOAD STREAMS
  // ---------------------------------------------------------------------------

  const loadStreams = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else if (streams.length === 0) {
      setIsLoading(true);
    }

    try {
      // For 'all' filter, default to 'public' to avoid permission errors
      // Authenticated users can switch to 'members' tab to see members-only streams
      const visibility = filter === 'all' ? 'public' : filter as StreamVisibility;
      const result = await getLiveStreams({ visibility });
      setStreams(result.streams);
    } catch (error: any) {
      // Handle permission errors vs actual errors
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.warn('⚠️ Firestore permissions not configured. Please set up security rules.');
        setStreams([]); // Show empty state
      } else {
        console.error('Error loading streams:', error);
        setStreams([]); // Show empty state on error
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, streams.length]);

  // Initial load and subscribe to updates
  useEffect(() => {
    loadStreams();

    // For 'all' filter, default to 'public' to avoid permission errors
    const visibility = filter === 'all' ? 'public' : filter as StreamVisibility;
    const unsubscribe = subscribeToLiveStreams((updatedStreams) => {
      setStreams(updatedStreams);
    }, visibility);

    return () => unsubscribe();
  }, [filter]);

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const canViewStream = useCallback((stream: Stream): boolean => {
    if (stream.visibility === 'public') return true;
    if (!user) return false;
    return tier !== 'free';
  }, [user, tier]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleStreamPress = (stream: Stream) => {
    if (!canViewStream(stream)) {
      navigation.navigate('Upgrade');
      return;
    }
    navigation.navigate('LiveStream', { streamId: stream.id });
  };

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
          <ActivityIndicator size="large" color={darkTheme.youtube.red} />
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
          <VideoCard
            variant="live"
            id={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            creatorName={MOCK_CREATOR_NAMES[item.creatorId] || 'Creator'}
            creatorId={item.creatorId}
            viewerCount={item.viewerCount || 0}
            isMembersOnly={item.visibility === 'members'}
            mediaType={item.mode}
            isLocked={!canViewStream(item)}
            onPress={() => handleStreamPress(item)}
            onCreatorPress={() => handleCreatorPress(item.creatorId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStreams(true)}
            tintColor={darkTheme.youtube.red}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.semantic.background,
  },

  // Top Bar
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: darkTheme.semantic.background,
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
    backgroundColor: darkTheme.youtube.red,
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
    color: darkTheme.semantic.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streamCount: {
    color: darkTheme.semantic.textSecondary,
    fontSize: 14,
  },

  // Chips
  chipsWrap: {
    backgroundColor: darkTheme.semantic.background,
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
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  chipActive: {
    backgroundColor: darkTheme.youtube.chipActive,
  },
  chipText: {
    color: darkTheme.semantic.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: darkTheme.youtube.chipActiveText,
  },

  // List
  listContent: {
    paddingBottom: 24,
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
    color: darkTheme.semantic.textSecondary,
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
    color: darkTheme.semantic.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
  },
});
