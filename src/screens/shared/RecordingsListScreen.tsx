/**
 * Recordings List Screen (Library)
 * 
 * Displays available recordings (VODs) in a YouTube-style mobile layout.
 * Uses the same card pattern from ContentFeedScreen and LiveStreamsListScreen.
 * 
 * FEATURES:
 * - Single-column vertical feed (same as Home)
 * - List public recordings
 * - Pull to refresh
 * - Navigate to replay screen
 * - Show duration badge (instead of LIVE badge)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
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

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString();
}

// =============================================================================
// TYPES
// =============================================================================

type NavigationProp = NativeStackNavigationProp<any>;

// =============================================================================
// RECORDING CARD COMPONENT
// =============================================================================

interface RecordingCardProps {
  recording: Recording;
  onPress: () => void;
  onPressCreator: () => void;
}

function RecordingCard({ recording, onPress, onPressCreator }: RecordingCardProps): JSX.Element {
  const isProcessing = recording.status === 'processing' || recording.status === 'pending';
  
  const avatarLetter = useMemo(() => {
    return (recording.creatorName?.[0] || '?').toUpperCase();
  }, [recording.creatorName]);

  return (
    <View style={styles.ytCard}>
      {/* Thumbnail */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isProcessing}
      >
        <View style={styles.ytThumbWrap}>
          {recording.thumbnailUrl ? (
            <Image
              source={{ uri: recording.thumbnailUrl }}
              style={styles.ytThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.ytThumbFallback}>
              <Text style={styles.ytThumbEmoji}>🎬</Text>
            </View>
          )}

          {/* Duration badge (bottom-right) */}
          {recording.status === 'ready' && recording.durationSeconds && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(recording.durationSeconds)}
              </Text>
            </View>
          )}

          {/* Members badge (top-right) */}
          {recording.visibility === 'members' && (
            <View style={styles.ytBadgeTopRight}>
              <Text style={styles.ytBadgeText}>🔒 Members</Text>
            </View>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Processing...</Text>
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
            {recording.title}
          </Text>
          <Text style={styles.ytSub} numberOfLines={1}>
            {recording.creatorName} • {formatCount(recording.viewCount || 0)} views •{' '}
            {formatRelativeDate(recording.createdAt)}
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
      console.error('[RecordingsListScreen] Load error:', err);
      setError(err.message || 'Failed to load recordings');
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
      console.error('[RecordingsListScreen] Load more error:', err);
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
          <ActivityIndicator size="large" color="#ff0000" />
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
          <RecordingCard
            recording={item}
            onPress={() => handleRecordingPress(item)}
            onPressCreator={() => handleCreatorPress(item.creatorId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRecordings(true)}
            tintColor="#ff0000"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#ff0000" />
            </View>
          ) : null
        }
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
  libraryIcon: {
    fontSize: 20,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  videoCount: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  // Chips (sort tabs)
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

  // Duration badge (replaces LIVE badge for recordings)
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
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
    backgroundColor: '#374151',
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Error banner
  errorBanner: {
    backgroundColor: '#7f1d1d',
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
