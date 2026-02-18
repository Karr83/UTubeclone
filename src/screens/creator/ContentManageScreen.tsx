/**
 * Content Manage Screen
 * 
 * Screen for creators to view and manage their uploaded content.
 * Includes filters, status badges, actions, and boost controls.
 * 
 * YouTube-style dark theme with filter chips and action menus.
 * 
 * TODO Phase 3: Add bulk actions (delete, visibility change)
 * TODO Phase 3: Add sorting options
 * TODO Phase 3: Add content search
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import { Content, ContentStatus } from '../../types/content';
import { BoostButton } from '../../components/boost';
import { LoadingView, EmptyState } from '../../components/common';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

type FilterType = 'all' | 'published' | 'pending' | 'rejected';

interface FilterChipProps {
  label: string;
  value: FilterType;
  count?: number;
  isActive: boolean;
  onPress: () => void;
}

// =============================================================================
// FILTER CHIP COMPONENT
// =============================================================================

function FilterChip({ label, count, isActive, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.filterChipBadge, isActive && styles.filterChipBadgeActive]}>
          <Text style={[styles.filterChipBadgeText, isActive && styles.filterChipBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

interface StatusBadgeProps {
  status: ContentStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getConfig = () => {
    switch (status) {
      case 'published':
        return { label: 'Published', bg: 'rgba(43,166,64,0.15)', color: '#2BA640' };
      case 'pending':
        return { label: 'In Review', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
      case 'rejected':
        return { label: 'Rejected', bg: 'rgba(239,68,68,0.15)', color: '#EF4444' };
      case 'removed':
        return { label: 'Removed', bg: 'rgba(113,113,113,0.15)', color: '#717171' };
      default:
        return { label: 'Draft', bg: 'rgba(113,113,113,0.15)', color: '#717171' };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// =============================================================================
// CONTENT ITEM COMPONENT
// =============================================================================

interface ContentItemProps {
  item: Content;
  onEdit: () => void;
  onDelete: () => void;
  onBoostChange: () => void;
}

function ContentItem({ item, onEdit, onDelete, onBoostChange }: ContentItemProps) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.contentItem}>
      {/* Thumbnail Row */}
      <View style={styles.contentRow}>
        <View style={styles.thumbWrap}>
          {item.thumbnailUrl || item.mediaUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl || item.mediaUrl }}
              style={styles.thumb}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbEmoji}>
                {item.mediaType === 'video' ? '🎬' : '📷'}
              </Text>
            </View>
          )}
          {item.mediaType === 'video' && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>▶</Text>
            </View>
          )}
          {item.isBoosted && (
            <View style={styles.boostOverlay}>
              <Text style={styles.boostOverlayText}>🚀</Text>
            </View>
          )}
        </View>

        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.metaRow}>
            <StatusBadge status={item.status} />
            {item.visibility === 'membersOnly' && (
              <View style={styles.membersBadge}>
                <Text style={styles.membersBadgeText}>Members</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statItem}>👁️ {item.viewCount}</Text>
            <Text style={styles.statItem}>❤️ {item.likeCount}</Text>
            <Text style={styles.statItem}>💬 {item.commentCount}</Text>
          </View>

          <Text style={styles.dateText}>
            Uploaded {formatDate(item.createdAt)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Actions Menu (Expanded) */}
      {showActions && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          {item.status === 'published' && (
            <View style={styles.boostButtonWrap}>
              <BoostButton content={item} onBoostChange={onBoostChange} compact />
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={onDelete}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionText, styles.actionTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ContentManageScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [content, setContent] = useState<Content[]>([]);
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadContent = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const response = await contentService.getCreatorContent(user.uid, { limit: 50 });
      setContent(response.items);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // ---------------------------------------------------------------------------
  // FILTERING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredContent(content);
    } else {
      setFilteredContent(content.filter((item) => item.status === activeFilter));
    }
  }, [content, activeFilter]);

  const getCounts = () => ({
    all: content.length,
    published: content.filter((c) => c.status === 'published').length,
    pending: content.filter((c) => c.status === 'pending').length,
    rejected: content.filter((c) => c.status === 'rejected').length,
  });

  const counts = getCounts();

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadContent();
  };

  const handleEdit = (item: Content) => {
    Alert.alert(
      'Edit Content',
      'Use the upload screen to publish an updated version of this content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Upload',
          onPress: () => navigation.navigate('Upload'),
        },
      ]
    );
  };

  const handleDelete = (item: Content) => {
    Alert.alert(
      'Delete Content',
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentService.deleteContent(item.id);
              loadContent();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete content');
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingView fullScreen message="Loading your content..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Content</Text>
          <Text style={styles.subtitle}>{content.length} total uploads</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <Text style={styles.uploadButtonIcon}>+</Text>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <FilterChip
          label="All"
          value="all"
          count={counts.all}
          isActive={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
        />
        <FilterChip
          label="Published"
          value="published"
          count={counts.published}
          isActive={activeFilter === 'published'}
          onPress={() => setActiveFilter('published')}
        />
        <FilterChip
          label="In Review"
          value="pending"
          count={counts.pending}
          isActive={activeFilter === 'pending'}
          onPress={() => setActiveFilter('pending')}
        />
        <FilterChip
          label="Rejected"
          value="rejected"
          count={counts.rejected}
          isActive={activeFilter === 'rejected'}
          onPress={() => setActiveFilter('rejected')}
        />
      </View>

      {/* Content List */}
      {filteredContent.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'all' ? '📭' : '🔍'}
          title={activeFilter === 'all' ? 'No content yet' : 'No results'}
          message={
            activeFilter === 'all'
              ? 'Upload your first video to get started!'
              : `No ${activeFilter} content found`
          }
        />
      ) : (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
          renderItem={({ item }) => (
            <ContentItem
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              onBoostChange={loadContent}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.semantic.text,
  },
  subtitle: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  uploadButtonIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.chipBackground,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: darkTheme.youtube.chipActive,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: darkTheme.semantic.text,
  },
  filterChipTextActive: {
    color: darkTheme.youtube.chipActiveText,
  },
  filterChipBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  filterChipBadgeTextActive: {
    color: darkTheme.youtube.chipActiveText,
  },

  // List
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },

  // Content Item
  contentItem: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbWrap: {
    width: 120,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: darkTheme.semantic.surfaceElevated,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: {
    fontSize: 24,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  boostOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  boostOverlayText: {
    fontSize: 12,
  },

  contentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: darkTheme.semantic.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  membersBadge: {
    backgroundColor: 'rgba(43,166,64,0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  membersBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2BA640',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statItem: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: darkTheme.semantic.textTertiary,
  },

  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDots: {
    fontSize: 20,
    color: darkTheme.semantic.textSecondary,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: darkTheme.semantic.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surfaceElevated,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: darkTheme.semantic.text,
  },
  actionTextDanger: {
    color: '#EF4444',
  },
  boostButtonWrap: {
    flex: 1,
  },
});
