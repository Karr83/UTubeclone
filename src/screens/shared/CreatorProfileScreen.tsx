/**
 * Creator Profile Screen (Channel Page)
 * 
 * Mobile YouTube-style channel page for viewing a creator's public profile.
 * 
 * FEATURES:
 * - Creator header (banner, avatar, name, bio, stats)
 * - Tab navigation (Videos / Live / About)
 * - Videos tab: Shows creator's recordings (VODs)
 * - Live tab: Shows if creator is live (navigates to stream)
 * - About tab: Basic creator info
 * 
 * NAVIGATION:
 * - Tap video card → ReplayScreen
 * - Tap live indicator → LiveStreamScreen
 * - Back button → previous screen
 * 
 * UI-ONLY: Uses existing services, no new business logic.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import * as recordingService from '../../services/recording.service';
import * as streamingService from '../../services/streaming.service';
import { Recording } from '../../types/recording';
import { Stream } from '../../types/streaming';
import { UserProfile } from '../../types/auth';
import { SmallVideoCard } from '../../components/video';

// =============================================================================
// TYPES
// =============================================================================

type CreatorProfileRouteParams = {
  CreatorProfile: {
    id: string; // creatorId
  };
};

type TabKey = 'videos' | 'live' | 'about';

interface TabItem {
  key: TabKey;
  label: string;
}

const TABS: TabItem[] = [
  { key: 'videos', label: 'Videos' },
  { key: 'live', label: 'Live' },
  { key: 'about', label: 'About' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// =============================================================================
// HELPER: Format duration
// =============================================================================

function formatDuration(seconds: number): string {
  return recordingService.formatDuration(seconds) || '0:00';
}

// =============================================================================
// LIVE STATUS COMPONENT
// =============================================================================

interface LiveStatusProps {
  stream: Stream | null;
  isLoading: boolean;
  onPress: () => void;
}

function LiveStatus({ stream, isLoading, onPress }: LiveStatusProps): JSX.Element {
  if (isLoading) {
    return (
      <View style={styles.liveContainer}>
        <ActivityIndicator size="small" color="#EF4444" />
        <Text style={styles.liveLoadingText}>Checking live status...</Text>
      </View>
    );
  }
  
  if (!stream || stream.status !== 'live') {
    return (
      <View style={styles.liveContainer}>
        <View style={styles.offlineIndicator}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>Creator is offline</Text>
        </View>
        <Text style={styles.offlineHint}>
          Check back later or explore their videos
        </Text>
      </View>
    );
  }
  
  return (
    <TouchableOpacity style={styles.liveContainer} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.liveCard}>
        {/* Thumbnail */}
        <View style={styles.liveThumbWrap}>
          {stream.thumbnailUrl ? (
            <Image
              source={{ uri: stream.thumbnailUrl }}
              style={styles.liveThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.liveThumbFallback}>
              <Text style={styles.liveThumbEmoji}>📺</Text>
            </View>
          )}
          
          {/* LIVE badge */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          
          {/* Viewer count */}
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerText}>
              👁 {formatCount(stream.viewerCount)} watching
            </Text>
          </View>
        </View>
        
        {/* Info */}
        <View style={styles.liveInfo}>
          <Text style={styles.liveTitle} numberOfLines={2}>
            {stream.title}
          </Text>
          <Text style={styles.liveCta}>Tap to join →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// ABOUT TAB COMPONENT
// =============================================================================

interface AboutTabProps {
  profile: UserProfile | null;
  recordingCount: number;
}

function AboutTab({ profile, recordingCount }: AboutTabProps): JSX.Element {
  return (
    <ScrollView style={styles.aboutContainer}>
      <View style={styles.aboutSection}>
        <Text style={styles.aboutLabel}>Joined</Text>
        <Text style={styles.aboutValue}>
          {profile?.createdAt ? profile.createdAt.toLocaleDateString() : 'Unknown'}
        </Text>
      </View>
      
      <View style={styles.aboutSection}>
        <Text style={styles.aboutLabel}>Videos</Text>
        <Text style={styles.aboutValue}>{recordingCount}</Text>
      </View>
      
      <View style={styles.aboutSection}>
        <Text style={styles.aboutLabel}>Role</Text>
        <Text style={styles.aboutValue}>
          {profile?.role === 'creator' ? '🎬 Creator' : '👤 User'}
        </Text>
      </View>
      
      {/* Placeholder for future stats */}
      <View style={styles.aboutPlaceholder}>
        <Text style={styles.aboutPlaceholderText}>
          More creator stats coming soon
        </Text>
      </View>
    </ScrollView>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CreatorProfileScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CreatorProfileRouteParams, 'CreatorProfile'>>();
  const creatorId = route.params?.id;
  
  const { user } = useAuth();
  
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [liveStream, setLiveStream] = useState<Stream | null>(null);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(true);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabKey>('videos');
  const [error, setError] = useState<string | null>(null);
  
  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------
  
  const fetchCreatorData = useCallback(async (refresh = false) => {
    if (!creatorId) return;
    
    if (refresh) setIsRefreshing(true);
    setError(null);
    
    try {
      // Fetch profile
      setIsLoadingProfile(true);
      const profileData = await authService.getUserProfile(creatorId);
      setProfile(profileData);
      setIsLoadingProfile(false);
      
      // Fetch recordings (public ones for viewers)
      setIsLoadingRecordings(true);
      const recordingsResponse = await recordingService.getCreatorRecordings(creatorId, {
        status: 'ready',
        limit: 50,
      });
      setRecordings(recordingsResponse.recordings);
      setIsLoadingRecordings(false);
      
      // Fetch live stream status
      setIsLoadingLive(true);
      const currentStream = await streamingService.getCreatorCurrentStream(creatorId);
      setLiveStream(currentStream);
      setIsLoadingLive(false);
      
    } catch (err: any) {
      console.error('[CreatorProfileScreen] Error:', err);
      setError(err.message || 'Failed to load creator profile');
    } finally {
      setIsRefreshing(false);
      setIsLoadingProfile(false);
      setIsLoadingRecordings(false);
      setIsLoadingLive(false);
    }
  }, [creatorId]);
  
  useEffect(() => {
    fetchCreatorData();
  }, [fetchCreatorData]);
  
  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  
  const handleRefresh = () => {
    fetchCreatorData(true);
  };
  
  const handleVideoPress = (recording: Recording) => {
    navigation.navigate('Replay', { recordingId: recording.id });
  };
  
  const handleLivePress = () => {
    if (liveStream) {
      navigation.navigate('LiveStream', { streamId: liveStream.id });
    }
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------
  
  const displayName = useMemo(() => {
    return profile?.displayName || profile?.email?.split('@')[0] || 'Creator';
  }, [profile]);
  
  const avatarLetter = useMemo(() => {
    return (displayName[0] || '?').toUpperCase();
  }, [displayName]);
  
  const isLive = liveStream?.status === 'live';
  
  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------
  
  if (isLoadingProfile && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading creator...</Text>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: ERROR
  // ---------------------------------------------------------------------------
  
  if (error && !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Creator Not Found</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: MAIN
  // ---------------------------------------------------------------------------
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity style={styles.headerBack} onPress={handleBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        
        {/* Banner placeholder */}
        <View style={styles.banner}>
          <View style={styles.bannerGradient} />
        </View>
        
        {/* Avatar + info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
            {isLive && (
              <View style={styles.avatarLiveDot} />
            )}
          </View>
          
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {profile?.role === 'creator' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.handle}>@{creatorId?.slice(0, 8)}</Text>
          
          <View style={styles.statsRow}>
            <Text style={styles.statText}>{recordings.length} videos</Text>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.statText}>
              {formatCount(recordings.reduce((sum, r) => sum + r.viewCount, 0))} total views
            </Text>
          </View>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.key === 'live' && isLive && (
                <Text style={styles.liveIndicator}> 🔴</Text>
              )}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab Content */}
      {activeTab === 'videos' && (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SmallVideoCard
              thumbnailUrl={item.thumbnailUrl || ''}
              title={item.title}
              creatorName={creator?.displayName || creator?.email || 'Creator'}
              duration={formatDuration(item.durationSeconds)}
              views={formatCount(item.viewCount)}
              timeAgo={formatDate(item.createdAt)}
              onPress={() => handleVideoPress(item)}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.videoRow}
          contentContainerStyle={styles.videoList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
            />
          }
          ListEmptyComponent={
            isLoadingRecordings ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No videos yet</Text>
              </View>
            )
          }
        />
      )}
      
      {activeTab === 'live' && (
        <ScrollView
          style={styles.liveTab}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
            />
          }
        >
          <LiveStatus
            stream={liveStream}
            isLoading={isLoadingLive}
            onPress={handleLivePress}
          />
        </ScrollView>
      )}
      
      {activeTab === 'about' && (
        <AboutTab profile={profile} recordingCount={recordings.length} />
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_CARD_WIDTH = (SCREEN_WIDTH - 36) / 2; // 2 columns with padding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  
  // Error
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: {
    color: '#6366F1',
    fontSize: 16,
  },
  
  // Header
  header: {
    position: 'relative',
  },
  headerBack: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  banner: {
    height: 100,
    backgroundColor: '#1F2937',
  },
  bannerGradient: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #374151, #1F2937)',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0B0B0B',
    position: 'relative',
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  avatarLiveDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0B0B0B',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  handle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  statDivider: {
    color: '#6B7280',
    fontSize: 13,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  liveIndicator: {
    fontSize: 10,
  },
  
  // Video Grid
  videoList: {
    padding: 12,
  },
  videoRow: {
    gap: 12,
  },
  videoCard: {
    width: VIDEO_CARD_WIDTH,
    marginBottom: 16,
  },
  videoThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  videoThumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbEmoji: {
    fontSize: 24,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  membersBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  membersBadgeText: {
    fontSize: 10,
  },
  videoInfo: {
    paddingTop: 8,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  videoMeta: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  
  // Live Tab
  liveTab: {
    flex: 1,
  },
  liveContainer: {
    padding: 16,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  offlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B7280',
  },
  offlineText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  offlineHint: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
  liveLoadingText: {
    color: '#9CA3AF',
    marginLeft: 8,
    fontSize: 14,
  },
  liveCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#111827',
    position: 'relative',
  },
  liveThumb: {
    width: '100%',
    height: '100%',
  },
  liveThumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveThumbEmoji: {
    fontSize: 40,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  liveInfo: {
    padding: 16,
  },
  liveTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  liveCta: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // About Tab
  aboutContainer: {
    flex: 1,
    padding: 16,
  },
  aboutSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  aboutLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  aboutValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  aboutPlaceholder: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  aboutPlaceholderText: {
    color: '#6B7280',
    fontSize: 13,
  },
  
  // Empty
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

