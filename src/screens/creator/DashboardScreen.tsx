/**
 * Creator Dashboard Screen
 * 
 * Main landing screen for creators showing overview stats,
 * recent uploads, and live status.
 * 
 * YouTube-style dark theme with stat cards and quick actions.
 * 
 * TODO Phase 3: Add real-time stats updates
 * TODO Phase 3: Add revenue/earnings widget
 * TODO Phase 3: Add subscriber growth chart
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { useStream } from '../../hooks/useStream';
import { contentService } from '../../services/content.service';
import { getCreatorInteractionStats } from '../../services/interaction.service';
import { Content } from '../../types/content';
import { LoadingView } from '../../components/common';
import { darkTheme } from '../../theme';

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

function StatCard({ icon, label, value, trend, color = '#3EA6FF' }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}20` }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && (
        <View style={styles.trendRow}>
          <Text style={[
            styles.trendText,
            trend.isPositive ? styles.trendPositive : styles.trendNegative
          ]}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
          <Text style={styles.trendPeriod}>vs last week</Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// RECENT UPLOAD ITEM
// =============================================================================

interface RecentUploadProps {
  item: Content;
  onPress: () => void;
}

function RecentUploadItem({ item, onPress }: RecentUploadProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#2BA640';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#717171';
    }
  };

  return (
    <TouchableOpacity style={styles.recentItem} onPress={onPress}>
      <View style={styles.recentThumb}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.recentThumbImg} />
        ) : (
          <View style={styles.recentThumbPlaceholder}>
            <Text style={styles.recentThumbEmoji}>
              {item.mediaType === 'video' ? '🎬' : '📷'}
            </Text>
          </View>
        )}
        {item.isBoosted && (
          <View style={styles.boostedBadge}>
            <Text style={styles.boostedBadgeText}>🚀</Text>
          </View>
        )}
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.recentMeta}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.recentStatus}>{item.status}</Text>
          <Text style={styles.recentDivider}>•</Text>
          <Text style={styles.recentViews}>{item.viewCount} views</Text>
        </View>
      </View>
      <Text style={styles.recentArrow}>›</Text>
    </TouchableOpacity>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DashboardScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { currentStream, isLive } = useStream();
  
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalViews: 0,
    totalLikes: 0,
    subscribers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    if (!profile?.uid) return;
    
    try {
      const response = await contentService.getCreatorContent(profile.uid, { limit: 5 });
      setRecentContent(response.items);
      
      // Calculate stats from content
      const allContent = await contentService.getCreatorContent(profile.uid, { limit: 100 });
      const totalViews = allContent.items.reduce((sum, item) => sum + (item.viewCount || 0), 0);
      const totalLikes = allContent.items.reduce((sum, item) => sum + (item.likeCount || 0), 0);
      const interactionStats = await getCreatorInteractionStats(profile.uid);
      
      setStats({
        totalUploads: allContent.items.length,
        totalViews,
        totalLikes,
        subscribers: interactionStats.subscribers,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingView fullScreen message="Loading dashboard..." />;
  }

  const displayName = profile?.displayName || profile?.email?.split('@')[0] || 'Creator';

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#FFFFFF"
          colors={['#FFFFFF']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.displayName}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'ProfileMain' })}
        >
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Status Banner */}
      {isLive && currentStream && (
        <TouchableOpacity
          style={styles.liveBanner}
          onPress={() => navigation.navigate('StreamTab', { screen: 'StreamDashboard' })}
        >
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE NOW</Text>
          <Text style={styles.liveTitle} numberOfLines={1}>
            {currentStream.title}
          </Text>
          <Text style={styles.liveViewers}>
            👁️ {currentStream.viewerCount}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionPrimary}
          onPress={() => navigation.navigate('ContentTab', { screen: 'Upload' })}
        >
          <Text style={styles.actionPrimaryIcon}>📤</Text>
          <Text style={styles.actionPrimaryText}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionSecondary}
          onPress={() => navigation.navigate('StreamTab', { screen: 'StreamDashboard' })}
        >
          <Text style={styles.actionSecondaryIcon}>📡</Text>
          <Text style={styles.actionSecondaryText}>Go Live</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionSecondary}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Text style={styles.actionSecondaryIcon}>📊</Text>
          <Text style={styles.actionSecondaryText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Channel Analytics</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="📹"
          label="Uploads"
          value={stats.totalUploads}
          color="#3EA6FF"
        />
        <StatCard
          icon="👁️"
          label="Views"
          value={stats.totalViews.toLocaleString()}
          trend={{ value: 12, isPositive: true }}
          color="#2BA640"
        />
        <StatCard
          icon="❤️"
          label="Likes"
          value={stats.totalLikes.toLocaleString()}
          trend={{ value: 8, isPositive: true }}
          color="#FF4444"
        />
        <StatCard
          icon="👥"
          label="Subscribers"
          value={stats.subscribers.toLocaleString()}
          color="#9147FF"
        />
      </View>

      {/* Recent Uploads */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Uploads</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ContentTab', { screen: 'ContentList' })}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {recentContent.length === 0 ? (
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No uploads yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('ContentTab', { screen: 'Upload' })}
          >
            <Text style={styles.emptyButtonText}>Upload your first video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.recentList}>
          {recentContent.map((item) => (
            <RecentUploadItem
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('ContentTab', { screen: 'ContentList' })}
            />
          ))}
        </View>
      )}

      {/* Quick Links */}
      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('StreamTab', { screen: 'RecordingsManage' })}
        >
          <Text style={styles.quickLinkIcon}>🎥</Text>
          <Text style={styles.quickLinkText}>Past Streams</Text>
          <Text style={styles.quickLinkArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Text style={styles.quickLinkIcon}>💰</Text>
          <Text style={styles.quickLinkText}>Earnings</Text>
          <Text style={styles.quickLinkArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'ProfileMain' })}
        >
          <Text style={styles.quickLinkIcon}>⚙️</Text>
          <Text style={styles.quickLinkText}>Channel Settings</Text>
          <Text style={styles.quickLinkArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    paddingBottom: 32,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginTop: 2,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Live Banner
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.15)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF0000',
    marginRight: 12,
  },
  liveTitle: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.semantic.text,
  },
  liveViewers: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionPrimaryIcon: {
    fontSize: 18,
  },
  actionPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.semantic.surface,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  actionSecondaryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionSecondaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.semantic.text,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3EA6FF',
    fontWeight: '500',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    padding: 4,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.semantic.text,
  },
  statLabel: {
    fontSize: 13,
    color: darkTheme.semantic.textSecondary,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendPositive: {
    color: '#2BA640',
  },
  trendNegative: {
    color: '#EF4444',
  },
  trendPeriod: {
    fontSize: 11,
    color: darkTheme.semantic.textTertiary,
  },

  // Recent Uploads
  recentList: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recentThumb: {
    width: 80,
    height: 45,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: darkTheme.semantic.surfaceElevated,
    position: 'relative',
  },
  recentThumbImg: {
    width: '100%',
    height: '100%',
  },
  recentThumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentThumbEmoji: {
    fontSize: 20,
  },
  boostedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    padding: 2,
  },
  boostedBadgeText: {
    fontSize: 10,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.semantic.text,
    marginBottom: 4,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  recentStatus: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
    textTransform: 'capitalize',
  },
  recentDivider: {
    marginHorizontal: 6,
    color: darkTheme.semantic.textTertiary,
  },
  recentViews: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },
  recentArrow: {
    fontSize: 20,
    color: darkTheme.semantic.textTertiary,
    marginLeft: 8,
  },

  // Empty Recent
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 16,
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Quick Links
  quickLinks: {
    paddingHorizontal: 16,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  quickLinkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    color: darkTheme.semantic.text,
  },
  quickLinkArrow: {
    fontSize: 20,
    color: darkTheme.semantic.textTertiary,
  },
});
