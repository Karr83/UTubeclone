/**
 * Content Feed Screen
 * 
 * Displays a feed of uploaded content from creators.
 * Uses the unified VideoCard component for consistent UI.
 * 
 * FEATURES:
 * - Fetching and displaying content from Firestore
 * - Filtering between public and members-only content
 * - Infinite scroll pagination
 * - BOOSTED CONTENT PRIORITIZATION
 * 
 * ACCESS CONTROL:
 * - Public content: Available to everyone
 * - Members-only content: Requires authentication
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import { boostService } from '../../services/boost.service';
import { Content, ContentListResponse } from '../../types/content';
import { VideoCard } from '../../components/video';
import { TopMenuIcon } from '../../components/navigation';
import { NavigationIcon } from '../../components/icons/navigation';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface ContentFeedScreenProps {
  /** Optional creator ID to filter content */
  creatorId?: string;
  /** Show only public content (for unauthenticated users) */
  publicOnly?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format duration in seconds to mm:ss or hh:mm:ss.
 */
function formatDuration(seconds?: number): string | undefined {
  if (!seconds) return undefined;
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ContentFeedScreen({
  creatorId,
  publicOnly = false,
}: ContentFeedScreenProps): JSX.Element {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  // Mock data for demo (when Firebase is offline)
  const MOCK_CONTENT: Content[] = [
    {
      id: 'mock-1',
      title: 'Amazing React Native Tutorial - Building Beautiful UIs',
      description: 'Learn how to build stunning mobile apps with React Native and Expo',
      creatorId: 'creator-1',
      creatorName: 'Tech Guru',
      mediaUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Video+1',
      thumbnailUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Video+1',
      mediaType: 'video',
      visibility: 'public',
      status: 'published',
      viewCount: 125000,
      likeCount: 8500,
      commentCount: 320,
      durationSeconds: 1245,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      isBoosted: false,
      boostLevel: 0,
    },
    {
      id: 'mock-2',
      title: 'Mastering TypeScript in 2024 - Complete Guide',
      description: 'Everything you need to know about TypeScript for modern development',
      creatorId: 'creator-2',
      creatorName: 'Code Master',
      mediaUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Video+2',
      thumbnailUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Video+2',
      mediaType: 'video',
      visibility: 'public',
      status: 'published',
      viewCount: 89000,
      likeCount: 6200,
      commentCount: 245,
      durationSeconds: 1820,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      isBoosted: true,
      boostLevel: 2,
    },
    {
      id: 'mock-3',
      title: 'Firebase Authentication Deep Dive',
      description: 'Learn how to implement secure authentication in your apps',
      creatorId: 'creator-3',
      creatorName: 'Dev Expert',
      mediaUrl: 'https://via.placeholder.com/1280x720/00AA00/FFFFFF?text=Video+3',
      thumbnailUrl: 'https://via.placeholder.com/1280x720/00AA00/FFFFFF?text=Video+3',
      mediaType: 'video',
      visibility: 'members',
      status: 'published',
      viewCount: 45000,
      likeCount: 3100,
      commentCount: 180,
      durationSeconds: 960,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      isBoosted: false,
      boostLevel: 0,
    },
    {
      id: 'mock-4',
      title: 'Building a YouTube Clone - Full Stack Tutorial',
      description: 'Create a complete video streaming platform from scratch',
      creatorId: 'creator-1',
      creatorName: 'Tech Guru',
      mediaUrl: 'https://via.placeholder.com/1280x720/FF6600/FFFFFF?text=Video+4',
      thumbnailUrl: 'https://via.placeholder.com/1280x720/FF6600/FFFFFF?text=Video+4',
      mediaType: 'video',
      visibility: 'public',
      status: 'published',
      viewCount: 210000,
      likeCount: 15200,
      commentCount: 890,
      durationSeconds: 2100,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      isBoosted: true,
      boostLevel: 3,
    },
    {
      id: 'mock-5',
      title: 'React Native Performance Optimization Tips',
      description: 'Make your React Native apps faster and smoother',
      creatorId: 'creator-2',
      creatorName: 'Code Master',
      mediaUrl: 'https://via.placeholder.com/1280x720/9900FF/FFFFFF?text=Video+5',
      thumbnailUrl: 'https://via.placeholder.com/1280x720/9900FF/FFFFFF?text=Video+5',
      mediaType: 'video',
      visibility: 'public',
      status: 'published',
      viewCount: 67000,
      likeCount: 4800,
      commentCount: 210,
      durationSeconds: 1450,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      isBoosted: false,
      boostLevel: 0,
    },
  ];

  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'members'>(
    publicOnly ? 'public' : 'all'
  );
  const [error, setError] = useState<string | null>(null);

  const showTabs = !creatorId && !publicOnly;

  // ---------------------------------------------------------------------------
  // FETCH CONTENT
  // ---------------------------------------------------------------------------

  const fetchContent = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      }

      try {
        let response: ContentListResponse;

        if (creatorId) {
          response = await contentService.getCreatorContent(creatorId, {
            status: 'published',
            limit: 20,
            startAfter: refresh ? undefined : lastId,
          });
        } else if (activeTab === 'public' || activeTab === 'all') {
          response = await boostService.getFeedWithBoostedFirst(
            20,
            refresh ? undefined : lastId
          );
        } else if (activeTab === 'members' && user) {
          response = await contentService.getMembersOnlyContent({
            limit: 20,
            startAfter: refresh ? undefined : lastId,
          });
        } else {
          response = await boostService.getFeedWithBoostedFirst(
            20,
            refresh ? undefined : lastId
          );
        }

        if (refresh) {
          setContent(response.items);
        } else {
          setContent((prev) => [...prev, ...response.items]);
        }

        setHasMore(response.hasMore);
        setLastId(response.lastId);
        setError(null);
      } catch (err: any) {
        // Handle permission errors vs actual errors
        if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
          console.warn('⚠️ Firestore permissions not configured. Please set up security rules.');
          setContent([]); // Show empty state
          setError('Permissions not configured. Please set up Firestore security rules.');
        } else {
          console.error('Error loading content:', err);
          setContent([]); // Show empty state on error
          setError('Failed to load content. Please try again.');
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [creatorId, activeTab, user, lastId]
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    setContent([]);
    setLastId(undefined);
    fetchContent(true);
  }, [activeTab, creatorId]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleRefresh = () => {
    setLastId(undefined);
    fetchContent(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      fetchContent(false);
    }
  };

  const handleContentPress = (item: Content) => {
    contentService.incrementViewCount(item.id);
    navigation.navigate('ContentDetail', { id: item.id });
  };

  const handleCreatorPress = (id: string) => {
    navigation.navigate('CreatorProfile', { id });
  };

  // ---------------------------------------------------------------------------
  // RENDER EMPTY STATE
  // ---------------------------------------------------------------------------

  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>No Content Yet</Text>
        <Text style={styles.emptyText}>
          {creatorId
            ? "This creator hasn't uploaded any content yet."
            : activeTab === 'members'
            ? 'No members-only content available.'
            : 'Be the first to discover new content!'}
        </Text>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading && content.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={darkTheme.youtube.red} />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          {creatorId ? 'Creator' : 'VibeTube'}
        </Text>
        <View style={styles.topBarActions}>
          <TopMenuIcon
            icon={<NavigationIcon name="search" size={24} />}
            onPress={() => console.log('Search pressed')}
          />
          <TopMenuIcon
            icon={<NavigationIcon name="notifications" size={24} />}
            onPress={() => console.log('Notifications pressed')}
          />
        </View>
      </View>

      {/* Category chips */}
      {showTabs && (
        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            <TouchableOpacity
              style={[styles.chip, activeTab === 'all' && styles.chipActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.chipText, activeTab === 'all' && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, activeTab === 'public' && styles.chipActive]}
              onPress={() => setActiveTab('public')}
            >
              <Text style={[styles.chipText, activeTab === 'public' && styles.chipTextActive]}>
                Public
              </Text>
            </TouchableOpacity>

            {user && (
              <TouchableOpacity
                style={[styles.chip, activeTab === 'members' && styles.chipActive]}
                onPress={() => setActiveTab('members')}
              >
                <Text style={[styles.chipText, activeTab === 'members' && styles.chipTextActive]}>
                  Members
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={content}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoCard
            variant="feed"
            id={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl || item.mediaUrl}
            duration={formatDuration(item.durationSeconds)}
            creatorId={item.creatorId}
            creatorName={item.creatorName}
            viewCount={item.viewCount}
            timestamp={item.createdAt}
            isMembersOnly={item.visibility === 'members'}
            isBoosted={item.isBoosted}
            boostLevel={item.boostLevel}
            mediaType={item.mediaType}
            onPress={() => handleContentPress(item)}
            onCreatorPress={() => handleCreatorPress(item.creatorId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={darkTheme.youtube.red}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
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
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: darkTheme.semantic.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: darkTheme.semantic.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topBarIcon: {
    color: darkTheme.semantic.text,
    fontSize: 18,
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
    backgroundColor: darkTheme.semantic.background,
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

  // Empty State
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

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: darkTheme.semantic.text,
    fontSize: 14,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
