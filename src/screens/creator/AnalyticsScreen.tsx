import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import * as recordingService from '../../services/recording.service';
import { getCreatorInteractionStats } from '../../services/interaction.service';

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps): JSX.Element {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function AnalyticsScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalRecordings: 0,
    totalViews: 0,
    totalLikes: 0,
    subscribers: 0,
  });

  const loadStats = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const [contentRes, recordingsRes, interactionStats] = await Promise.all([
        contentService.getCreatorContent(profile.uid, { limit: 100 }),
        recordingService.getCreatorRecordings(profile.uid, { limit: 100 }),
        getCreatorInteractionStats(profile.uid),
      ]);

      const contentViews = contentRes.items.reduce((sum, item) => sum + (item.viewCount || 0), 0);
      const contentLikes = contentRes.items.reduce((sum, item) => sum + (item.likeCount || 0), 0);
      const recordingViews = recordingsRes.recordings.reduce((sum, rec) => sum + (rec.viewCount || 0), 0);

      setStats({
        totalUploads: contentRes.items.length,
        totalRecordings: recordingsRes.recordings.length,
        totalViews: contentViews + recordingViews,
        totalLikes: contentLikes,
        subscribers: interactionStats.subscribers,
      });
    } catch (error) {
      console.error('[AnalyticsScreen] Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const engagementRate = useMemo(() => {
    if (stats.totalViews <= 0) return '0%';
    return `${((stats.totalLikes / stats.totalViews) * 100).toFixed(1)}%`;
  }, [stats.totalLikes, stats.totalViews]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            loadStats();
          }}
          tintColor="#fff"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Live channel performance snapshot</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Uploads" value={stats.totalUploads.toString()} />
        <MetricCard label="Recordings" value={stats.totalRecordings.toString()} />
        <MetricCard label="Subscribers" value={stats.subscribers.toString()} />
        <MetricCard label="Total Views" value={stats.totalViews.toLocaleString()} />
        <MetricCard label="Total Likes" value={stats.totalLikes.toLocaleString()} />
        <MetricCard label="Engagement" value={engagementRate} />
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>What this means</Text>
        <Text style={styles.noteText}>
          Engagement is calculated as likes divided by views across your current content and recordings.
        </Text>
        {isLoading && <Text style={styles.noteText}>Loading latest data...</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  metricCard: {
    width: '50%',
    padding: 8,
  },
  metricValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  metricLabel: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  noteTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});

