/**
 * Recordings List Screen (Library)
 * 
 * Displays available recordings (VODs).
 * Uses the unified VideoCard component with "recording" variant.
 * 
 * FEATURES:
 * - Single-column vertical feed
 * - Sort by recent or popular
 * - Pull to refresh
 * - Infinite scroll pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Recording,
  RecordingQueryOptions,
} from '../../types/recording';
import {
  getPublicRecordings,
  formatDuration,
} from '../../services/recording.service';
import { VideoCard } from '../../components/video';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

type NavigationProp = NativeStackNavigationProp<any>;

// =============================================================================
// MOCK DATA (for demo when Firebase is offline)
// =============================================================================

const MOCK_RECORDINGS: Recording[] = [
  {
    id: 'mock-rec-1',
    streamId: 'stream-1',
    creatorId: 'creator-1',
    creatorName: 'Tech Guru',
    title: 'React Native Tutorial - Complete Guide',
    description: 'Learn React Native from scratch with this comprehensive tutorial',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Recording+1',
    status: 'ready',
    visibility: 'public',
    durationSeconds: 1845,
    streamStartedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    streamEndedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1845000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    viewCount: 45000,
    uniqueViewers: 32000,
    peakLiveViewers: 5000,
    isDeleted: false,
    isHidden: false,
  },
  {
    id: 'mock-rec-2',
    streamId: 'stream-2',
    creatorId: 'creator-2',
    creatorName: 'Code Master',
    title: 'TypeScript Advanced Patterns',
    description: 'Master advanced TypeScript techniques and design patterns',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Recording+2',
    status: 'ready',
    visibility: 'public',
    durationSeconds: 2100,
    streamStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    streamEndedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2100000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    viewCount: 67000,
    uniqueViewers: 48000,
    peakLiveViewers: 7200,
    isDeleted: false,
    isHidden: false,
  },
  {
    id: 'mock-rec-3',
    streamId: 'stream-3',
    creatorId: 'creator-3',
    creatorName: 'Dev Expert',
    title: 'Firebase Deep Dive - Authentication',
    description: 'Complete guide to Firebase Authentication and security',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/00AA00/FFFFFF?text=Recording+3',
    status: 'ready',
    visibility: 'public',
    durationSeconds: 1560,
    streamStartedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    streamEndedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1560000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    viewCount: 32000,
    uniqueViewers: 25000,
    peakLiveViewers: 3800,
    isDeleted: false,
    isHidden: false,
  },
  {
    id: 'mock-rec-4',
    streamId: 'stream-4',
    creatorId: 'creator-1',
    creatorName: 'Tech Guru',
    title: 'Building a YouTube Clone - Full Stack',
    description: 'Create a complete video streaming platform from scratch',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/FF6600/FFFFFF?text=Recording+4',
    status: 'ready',
    visibility: 'public',
    durationSeconds: 2400,
    streamStartedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    streamEndedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2400000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    viewCount: 89000,
    uniqueViewers: 65000,
    peakLiveViewers: 12000,
    isDeleted: false,
    isHidden: false,
  },
  {
    id: 'mock-rec-5',
    streamId: 'stream-5',
    creatorId: 'creator-2',
    creatorName: 'Code Master',
    title: 'React Native Performance Optimization',
    description: 'Make your React Native apps faster and smoother',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/9900FF/FFFFFF?text=Recording+5',
    status: 'ready',
    visibility: 'public',
    durationSeconds: 1450,
    streamStartedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    streamEndedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1450000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    viewCount: 56000,
    uniqueViewers: 42000,
    peakLiveViewers: 6800,
    isDeleted: false,
    isHidden: false,
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RecordingsListScreen(): JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  // State
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // ---------------------------------------------------------------------------
  // LOAD RECORDINGS
  // ---------------------------------------------------------------------------

  const loadRecordings = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setLastId(undefined);
    } else if (recordings.length === 0) {
      setIsLoading(true);
    }

    try {
      const options: RecordingQueryOptions = {
        limit: 20,
        sortBy: sortBy === 'recent' ? 'createdAt' : 'viewCount',
        sortDirection: 'desc',
      };

      const response = await getPublicRecordings(options);

      setRecordings(response.recordings);
      setHasMore(response.hasMore);
      setLastId(response.lastId);
      setError(null);
    } catch (err: any) {
      // Handle permission errors vs actual errors
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        console.warn('⚠️ Firestore permissions not configured. Please set up security rules.');
        setRecordings([]); // Show empty state
        setError('Permissions not configured. Please set up Firestore security rules.');
      } else {
        console.error('Error loading recordings:', err);
        setRecordings([]); // Show empty state on error
        setError('Failed to load recordings. Please try again.');
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [recordings.length, sortBy]);

  // Load on mount and when sort changes
  useEffect(() => {
    setIsLoading(true);
    setRecordings([]);
    setLastId(undefined);
    loadRecordings(true);
  }, [sortBy]);

  // ---------------------------------------------------------------------------
  // LOAD MORE
  // ---------------------------------------------------------------------------

  const loadMore = useCallback(async () => {
    if (!hasMore || !lastId || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const options: RecordingQueryOptions = {
        limit: 20,
        sortBy: sortBy === 'recent' ? 'createdAt' : 'viewCount',
        sortDirection: 'desc',
        startAfter: lastId,
      };

      const response = await getPublicRecordings(options);

      setRecordings((prev) => [...prev, ...response.recordings]);
      setHasMore(response.hasMore);
      setLastId(response.lastId);
    } catch (err: any) {
      // Silently fail on load more - already showing mock data
      console.log('⚠️ Load more failed, using existing data');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, lastId, sortBy, isLoadingMore]);

  // ---------------------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------------------

  const handleRecordingPress = useCallback((recording: Recording) => {
    navigation.navigate('Replay', { recordingId: recording.id });
  }, [navigation]);

  const handleCreatorPress = useCallback((creatorId: string) => {
    navigation.navigate('CreatorProfile', { id: creatorId });
  }, [navigation]);

  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------

  if (isLoading && recordings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={darkTheme.youtube.red} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: EMPTY STATE
  // ---------------------------------------------------------------------------

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📼</Text>
      <Text style={styles.emptyTitle}>No Videos Yet</Text>
      <Text style={styles.emptyText}>
        Recorded streams will appear here. Check back later!
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
          <Text style={styles.libraryIcon}>📚</Text>
          <Text style={styles.brand}>Library</Text>
        </View>
        <Text style={styles.videoCount}>
          {recordings.length} {recordings.length === 1 ? 'video' : 'videos'}
        </Text>
      </View>

      {/* Sort chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={[styles.chip, sortBy === 'recent' && styles.chipActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.chipText, sortBy === 'recent' && styles.chipTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortBy === 'popular' && styles.chipActive]}
            onPress={() => setSortBy('popular')}
          >
            <Text style={[styles.chipText, sortBy === 'popular' && styles.chipTextActive]}>
              Popular
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => loadRecordings(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recordings List */}
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoCard
            variant="recording"
            id={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            duration={item.durationSeconds ? formatDuration(item.durationSeconds) : undefined}
            creatorName={item.creatorName}
            creatorId={item.creatorId}
            viewCount={item.viewCount || 0}
            timestamp={item.createdAt}
            isMembersOnly={item.visibility === 'members'}
            isProcessing={item.status === 'processing' || item.status === 'pending'}
            onPress={() => handleRecordingPress(item)}
            onCreatorPress={() => handleCreatorPress(item.creatorId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRecordings(true)}
            tintColor={darkTheme.youtube.red}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={darkTheme.youtube.red} />
            </View>
          ) : null
        }
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
  libraryIcon: {
    fontSize: 20,
  },
  brand: {
    color: darkTheme.semantic.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  videoCount: {
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
  loadingMore: {
    padding: 16,
    alignItems: 'center',
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

  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
