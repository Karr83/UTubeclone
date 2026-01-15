/**
 * Content Feed Screen
 * 
 * Displays a feed of uploaded content from creators.
 * This screen demonstrates:
 * - Fetching and displaying content from Firestore
 * - Filtering between public and members-only content
 * - Infinite scroll pagination
 * - Basic content card display
 * - BOOSTED CONTENT PRIORITIZATION
 * 
 * ACCESS CONTROL:
 * - Public content: Available to everyone
 * - Members-only content: Requires authentication
 * 
 * BOOST SORTING:
 * - Boosted content appears first in the feed
 * - Higher boost levels appear before lower levels
 * - Non-boosted content sorted by date
 * 
 * USAGE:
 * - Can be used as main home feed
 * - Can be filtered to show specific creator's content
 * - Can be embedded in tabs or as standalone screen
 * 
 * FUTURE ENHANCEMENTS:
 * - Content categories/filters
 * - Search functionality
 * - Grid/list view toggle
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import { boostService } from '../../services/boost.service';
import { Content, ContentListResponse } from '../../types/content';

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
// CONTENT CARD COMPONENT
// =============================================================================

interface ContentCardProps {
  content: Content;
  onPress: (content: Content) => void;
  onPressCreator: (creatorId: string) => void;
}

function ContentCard({ content, onPress, onPressCreator }: ContentCardProps): JSX.Element {
  // UI-only: we don't have creator profile data on the Content model yet, so we
  // render a simple avatar placeholder from creatorId.
  const avatarLetter = useMemo(() => {
    return (content.creatorId?.[0] || '?').toUpperCase();
  }, [content.creatorId]);

  return (
    <View style={styles.ytCard}>
      {/* Thumbnail */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(content)}>
        <View style={styles.ytThumbWrap}>
          {content.thumbnailUrl || content.mediaUrl ? (
            <Image
              source={{ uri: content.thumbnailUrl || content.mediaUrl }}
              style={styles.ytThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.ytThumbFallback}>
              <Text style={styles.ytThumbEmoji}>
                {content.mediaType === 'video' ? '🎬' : '📷'}
              </Text>
            </View>
          )}

          {/* Media Type Badge */}
          <View style={styles.ytMediaTypeBadge}>
            <Text style={styles.ytMediaTypeText}>
              {content.mediaType === 'video' ? '▶️' : '📷'}
            </Text>
          </View>

          {/* Visibility Badge */}
          {content.visibility === 'membersOnly' && (
            <View style={styles.ytBadgeTopRight}>
              <Text style={styles.ytBadgeText}>🔒 Members</Text>
            </View>
          )}

          {/* Boosted Badge */}
          {content.isBoosted && (
            <View style={styles.ytBadgeBottomLeft}>
              <Text style={styles.ytBadgeText}>
                🚀 {content.boostLevel >= 4 ? 'Featured' : 'Boosted'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Meta row */}
      <View style={styles.ytMetaRow}>
        <TouchableOpacity
          style={styles.ytAvatar}
          onPress={() => onPressCreator(content.creatorId)}
          activeOpacity={0.85}
        >
          <Text style={styles.ytAvatarText}>{avatarLetter}</Text>
        </TouchableOpacity>

        <View style={styles.ytTextCol}>
          <Text style={styles.ytTitle} numberOfLines={2}>
            {content.title}
          </Text>
          <Text style={styles.ytSub} numberOfLines={1}>
            {content.creatorId.slice(0, 8)} • {formatCount(content.viewCount)} views •{' '}
            {formatDate(content.createdAt)}
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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format large numbers with K/M suffix.
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format date to relative time string.
 */
function formatDate(date: Date): string {
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

  /**
   * Fetch content based on current filters.
   */
  /**
   * Fetch content with boosted content prioritization.
   * 
   * BOOST SORTING LOGIC:
   * - For main feed (all/public tabs): Use getFeedWithBoostedFirst()
   * - Boosted content appears first, sorted by boost level (highest first)
   * - Non-boosted content follows, sorted by createdAt
   * 
   * FUTURE PAYMENT INTEGRATION:
   * - Paid boosts will have higher levels (3-5)
   * - Featured content (admin boosted) will always appear first
   */
  const fetchContent = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      }

      try {
        let response: ContentListResponse;

        if (creatorId) {
          // Fetch specific creator's content (no boost prioritization needed)
          response = await contentService.getCreatorContent(creatorId, {
            status: 'published',
            limit: 20,
            startAfter: refresh ? undefined : lastId,
          });
        } else if (activeTab === 'public' || activeTab === 'all') {
          // USE BOOSTED CONTENT FIRST for main feed
          // This shows boosted content at the top, then regular content by date
          response = await boostService.getFeedWithBoostedFirst(
            20,
            refresh ? undefined : lastId
          );
        } else if (activeTab === 'members' && user) {
          // Fetch members-only content
          response = await contentService.getMembersOnlyContent({
            limit: 20,
            startAfter: refresh ? undefined : lastId,
          });
        } else {
          // Fallback: Fetch public content with boost prioritization
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
        setError(err.message || 'Failed to load content');
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

  /**
   * Pull-to-refresh handler.
   */
  const handleRefresh = () => {
    setLastId(undefined);
    fetchContent(true);
  };

  /**
   * Load more content when reaching end of list.
   */
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      fetchContent(false);
    }
  };

  /**
   * Handle content card press.
   */
  const handleContentPress = (item: Content) => {
    // Increment view count
    contentService.incrementViewCount(item.id);

    // UI-only navigation: opens the placeholder ContentDetail screen.
    // This will later be replaced with the real “watch/content” screen from Figma.
    navigation.navigate('ContentDetail', { id: item.id });
  };

  const handleCreatorPress = (id: string) => {
    // UI-only navigation: opens placeholder creator profile screen.
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
        <ActivityIndicator size="large" color="#6366F1" />
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
          {creatorId ? 'Creator' : 'MS GIFT'}
        </Text>
        <View style={styles.topBarActions}>
          <Text style={styles.topBarIcon}>🔍</Text>
          <Text style={styles.topBarIcon}>🔔</Text>
        </View>
      </View>

      {/* Category chips (maps to existing filter tabs; UI-only) */}
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
          <ContentCard
            content={item}
            onPress={handleContentPress}
            onPressCreator={handleCreatorPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#6366F1" />
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
    backgroundColor: '#0B0B0B',
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#0B0B0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topBarIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },

  // Chips (maps to existing tabs)
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

  // YouTube-style card
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
    fontSize: 40,
  },
  ytMediaTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ytMediaTypeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  ytBadgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ytBadgeBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
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
    backgroundColor: '#0B0B0B',
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Error
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#111827',
    fontSize: 14,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});

