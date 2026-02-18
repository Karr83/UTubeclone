import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import * as recordingService from '../../services/recording.service';
import { getCreatorInteractionStats } from '../../services/interaction.service';

const REVENUE_PER_1000_VIEWS = 2.5;
const REVENUE_PER_SUBSCRIBER = 0.5;

export default function EarningsScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [subscribers, setSubscribers] = useState(0);

  const loadEarningsData = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const [contentRes, recordingsRes, interactionStats] = await Promise.all([
        contentService.getCreatorContent(profile.uid, { limit: 100 }),
        recordingService.getCreatorRecordings(profile.uid, { limit: 100 }),
        getCreatorInteractionStats(profile.uid),
      ]);
      const totalContentViews = contentRes.items.reduce((sum, item) => sum + (item.viewCount || 0), 0);
      const totalRecordingViews = recordingsRes.recordings.reduce((sum, item) => sum + (item.viewCount || 0), 0);
      setViews(totalContentViews + totalRecordingViews);
      setSubscribers(interactionStats.subscribers);
    } catch (error) {
      console.error('[EarningsScreen] Failed to load earnings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    loadEarningsData();
  }, [loadEarningsData]);

  const estimatedAdRevenue = useMemo(() => (views / 1000) * REVENUE_PER_1000_VIEWS, [views]);
  const estimatedMembershipRevenue = useMemo(() => subscribers * REVENUE_PER_SUBSCRIBER, [subscribers]);
  const estimatedTotal = useMemo(
    () => estimatedAdRevenue + estimatedMembershipRevenue,
    [estimatedAdRevenue, estimatedMembershipRevenue]
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            loadEarningsData();
          }}
          tintColor="#fff"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Estimated from current channel metrics</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ad revenue estimate</Text>
        <Text style={styles.value}>${estimatedAdRevenue.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Subscription estimate</Text>
        <Text style={styles.value}>${estimatedMembershipRevenue.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total estimate</Text>
        <Text style={styles.value}>${estimatedTotal.toFixed(2)}</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>Views used: {views.toLocaleString()}</Text>
        <Text style={styles.metaText}>Subscribers used: {subscribers.toLocaleString()}</Text>
        {isLoading && <Text style={styles.metaText}>Loading latest metrics...</Text>}
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
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  value: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 6,
  },
  meta: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
  },
});

