/**
 * Content Manage Screen
 * 
 * Screen for creators to view and manage their uploaded content.
 * Includes boost controls for published content.
 * 
 * FUTURE PAYMENT INTEGRATION:
 * When payments are added, the BoostButton will show:
 * - Available paid boost options
 * - Pricing for higher boost levels
 * - Purchase flow for paid boosts
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import { Content } from '../../types/content';
import { BoostButton } from '../../components/boost';

export default function ContentManageScreen(): JSX.Element {
  const { user } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadContent();
    }
  }, [user?.uid]);

  const loadContent = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await contentService.getCreatorContent(user.uid);
      setContent(response.items);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadContent();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Content</Text>
        <Text style={styles.count}>{content.length} items</Text>
      </View>

      {content.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No Content Yet</Text>
          <Text style={styles.emptyText}>Upload your first content to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.contentItem}>
              {/* Content Info */}
              <View style={styles.contentInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.contentTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.isBoosted && (
                    <View style={styles.boostedBadge}>
                      <Text style={styles.boostedBadgeText}>🚀</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contentMeta}>
                  {item.mediaType} • {item.visibility} • {item.viewCount} views
                </Text>
                <Text style={[
                  styles.contentStatus,
                  item.status === 'published' && styles.statusPublished,
                  item.status === 'pending' && styles.statusPending,
                  item.status === 'rejected' && styles.statusRejected,
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              
              {/* Boost Button - Only show for published content */}
              {item.status === 'published' && (
                <View style={styles.boostContainer}>
                  <BoostButton 
                    content={item} 
                    onBoostChange={loadContent}
                    compact 
                  />
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  count: {
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    padding: 16,
  },
  contentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentInfo: {
    flex: 1,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  boostedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boostedBadgeText: {
    fontSize: 12,
  },
  contentMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  contentStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  statusPublished: {
    color: '#059669',
  },
  statusPending: {
    color: '#D97706',
  },
  statusRejected: {
    color: '#DC2626',
  },
  boostContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

