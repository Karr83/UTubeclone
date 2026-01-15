/**
 * Admin Dashboard Screen
 * 
 * Main admin landing screen showing:
 * - Platform statistics overview
 * - Quick access to moderation queues
 * - Pending content count
 * - User management shortcuts
 * 
 * ACCESS CONTROL:
 * - Only accessible to users with role='admin'
 * - Role check performed at navigation level
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import { AdminDashboardStats } from '../../types/admin';

// =============================================================================
// COMPONENT
// =============================================================================

export default function AdminDashboardScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadStats = useCallback(async () => {
    try {
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  // ---------------------------------------------------------------------------
  // ACCESS CONTROL
  // ---------------------------------------------------------------------------

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedEmoji}>🚫</Text>
        <Text style={styles.accessDeniedTitle}>Admin Access Only</Text>
        <Text style={styles.accessDeniedText}>
          You do not have permission to access this area.
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#DC2626"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome, {profile?.email?.split('@')[0] || 'Admin'}
        </Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Pending Content Alert */}
      {stats && stats.pendingContent > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => navigation.navigate('ContentModeration')}
        >
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{stats.pendingContent}</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Content Awaiting Review</Text>
            <Text style={styles.alertSubtitle}>
              {stats.pendingContent} item{stats.pendingContent !== 1 ? 's' : ''} in moderation queue
            </Text>
          </View>
          <Text style={styles.alertArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ContentModeration')}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionLabel}>Content</Text>
            <Text style={styles.actionSublabel}>Moderation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <Text style={styles.actionEmoji}>👥</Text>
            <Text style={styles.actionLabel}>Users</Text>
            <Text style={styles.actionSublabel}>Management</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Overview */}
      {stats && (
        <>
          {/* User Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.usersByRole.creator}</Text>
                <Text style={styles.statLabel}>Creators</Text>
              </View>
              <View style={[styles.statCard, stats.suspendedUsers > 0 && styles.statCardWarning]}>
                <Text style={[styles.statValue, stats.suspendedUsers > 0 && styles.statValueWarning]}>
                  {stats.suspendedUsers}
                </Text>
                <Text style={styles.statLabel}>Suspended</Text>
              </View>
            </View>

            {/* User Role Breakdown */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>👤 Regular Users</Text>
                <Text style={styles.breakdownValue}>{stats.usersByRole.user}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>🎨 Creators</Text>
                <Text style={styles.breakdownValue}>{stats.usersByRole.creator}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>🛡️ Admins</Text>
                <Text style={styles.breakdownValue}>{stats.usersByRole.admin}</Text>
              </View>
            </View>
          </View>

          {/* Content Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalContent}</Text>
                <Text style={styles.statLabel}>Total Content</Text>
              </View>
              <View style={[styles.statCard, stats.pendingContent > 0 && styles.statCardPending]}>
                <Text style={[styles.statValue, stats.pendingContent > 0 && styles.statValuePending]}>
                  {stats.pendingContent}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.contentByStatus.published}</Text>
                <Text style={styles.statLabel}>Published</Text>
              </View>
            </View>

            {/* Content Status Breakdown */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>⏳ Pending</Text>
                <Text style={[styles.breakdownValue, stats.pendingContent > 0 && styles.breakdownValuePending]}>
                  {stats.contentByStatus.pending}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>✅ Published</Text>
                <Text style={styles.breakdownValue}>{stats.contentByStatus.published}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>❌ Rejected</Text>
                <Text style={styles.breakdownValue}>{stats.contentByStatus.rejected}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>🗑️ Removed</Text>
                <Text style={styles.breakdownValue}>{stats.contentByStatus.removed}</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{stats.recentActions}</Text>
              <Text style={styles.activityLabel}>moderation actions in the last 24 hours</Text>
            </View>
          </View>
        </>
      )}

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FECACA',
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // Error
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertBadge: {
    backgroundColor: '#F59E0B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#B45309',
    marginTop: 2,
  },
  alertArrow: {
    fontSize: 20,
    color: '#92400E',
  },

  // Section
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSublabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardWarning: {
    backgroundColor: '#FEE2E2',
  },
  statCardPending: {
    backgroundColor: '#FEF3C7',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statValueWarning: {
    color: '#DC2626',
  },
  statValuePending: {
    color: '#D97706',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  breakdownValuePending: {
    color: '#D97706',
  },

  // Activity Card
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activityValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  activityLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  // Access Denied
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  accessDeniedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  bottomPadding: {
    height: 48,
  },
});

