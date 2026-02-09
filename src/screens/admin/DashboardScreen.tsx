/**
 * Admin Dashboard Screen
 * 
 * Main admin landing screen showing platform statistics,
 * moderation alerts, and quick actions.
 * 
 * YouTube-style dark theme with admin accent color.
 * 
 * TODO Phase 3: Add real-time stats updates
 * TODO Phase 3: Add activity feed/timeline
 * TODO Phase 3: Add revenue/earnings dashboard
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import { AdminDashboardStats } from '../../types/admin';
import { LoadingView, ErrorView } from '../../components/common';
import { darkTheme } from '../../theme';

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  sublabel?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  onPress?: () => void;
}

function StatCard({ icon, label, value, sublabel, variant = 'default', onPress }: StatCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'warning':
        return { bg: 'rgba(245,158,11,0.15)', accent: '#F59E0B' };
      case 'danger':
        return { bg: 'rgba(239,68,68,0.15)', accent: '#EF4444' };
      case 'success':
        return { bg: 'rgba(43,166,64,0.15)', accent: '#2BA640' };
      default:
        return { bg: darkTheme.semantic.surface, accent: '#3EA6FF' };
    }
  };

  const variantStyle = getVariantStyle();

  const card = (
    <View style={[styles.statCard, { backgroundColor: variantStyle.bg }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, variant !== 'default' && { color: variantStyle.accent }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity style={styles.statCardWrap} onPress={onPress}>{card}</TouchableOpacity>;
  }

  return <View style={styles.statCardWrap}>{card}</View>;
}

// =============================================================================
// ALERT BANNER COMPONENT
// =============================================================================

interface AlertBannerProps {
  count: number;
  title: string;
  subtitle: string;
  icon: string;
  variant: 'warning' | 'danger';
  onPress: () => void;
}

function AlertBanner({ count, title, subtitle, icon, variant, onPress }: AlertBannerProps) {
  const isWarning = variant === 'warning';
  
  return (
    <TouchableOpacity
      style={[styles.alertBanner, isWarning ? styles.alertWarning : styles.alertDanger]}
      onPress={onPress}
    >
      <View style={[styles.alertBadge, isWarning ? styles.alertBadgeWarning : styles.alertBadgeDanger]}>
        <Text style={styles.alertBadgeText}>{count}</Text>
      </View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, isWarning ? styles.alertTitleWarning : styles.alertTitleDanger]}>
          {icon} {title}
        </Text>
        <Text style={[styles.alertSubtitle, isWarning ? styles.alertSubtitleWarning : styles.alertSubtitleDanger]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.alertArrow, isWarning ? styles.alertTitleWarning : styles.alertTitleDanger]}>→</Text>
    </TouchableOpacity>
  );
}

// =============================================================================
// BREAKDOWN ROW COMPONENT
// =============================================================================

interface BreakdownRowProps {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}

function BreakdownRow({ icon, label, value, highlight }: BreakdownRowProps) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownIcon}>{icon}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, highlight && styles.breakdownValueHighlight]}>
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AdminDashboardScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

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
      <View style={[styles.accessDenied, { paddingTop: insets.top }]}>
        <Text style={styles.accessDeniedEmoji}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Admin Access Required</Text>
        <Text style={styles.accessDeniedText}>
          You don't have permission to access this area.
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingView fullScreen message="Loading dashboard..." />;
  }

  // ---------------------------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------------------------

  if (error && !stats) {
    return (
      <ErrorView
        error={error}
        onRetry={loadStats}
        fullScreen
        icon="⚠️"
      />
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const displayName = profile?.displayName || profile?.email?.split('@')[0] || 'Admin';

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
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.displayName}>Welcome, {displayName}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>🛡️ ADMIN</Text>
        </View>
      </View>

      {/* Alert Banners */}
      {stats && stats.pendingContent > 0 && (
        <AlertBanner
          count={stats.pendingContent}
          title="Content Awaiting Review"
          subtitle={`${stats.pendingContent} item${stats.pendingContent !== 1 ? 's' : ''} in moderation queue`}
          icon="📋"
          variant="warning"
          onPress={() => navigation.navigate('ContentModeration')}
        />
      )}

      {stats && stats.suspendedUsers > 0 && (
        <AlertBanner
          count={stats.suspendedUsers}
          title="Suspended Users"
          subtitle={`${stats.suspendedUsers} user${stats.suspendedUsers !== 1 ? 's' : ''} currently suspended`}
          icon="⚠️"
          variant="danger"
          onPress={() => navigation.navigate('UserManagement')}
        />
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ContentModeration')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Text style={styles.actionIcon}>📋</Text>
          </View>
          <Text style={styles.actionLabel}>Content</Text>
          <Text style={styles.actionSublabel}>Moderation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(62,166,255,0.15)' }]}>
            <Text style={styles.actionIcon}>👥</Text>
          </View>
          <Text style={styles.actionLabel}>Users</Text>
          <Text style={styles.actionSublabel}>Management</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Reports')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
            <Text style={styles.actionIcon}>🚨</Text>
          </View>
          <Text style={styles.actionLabel}>Reports</Text>
          <Text style={styles.actionSublabel}>Review</Text>
        </TouchableOpacity>
      </View>

      {/* Platform Overview */}
      {stats && (
        <>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="👥"
              label="Total Users"
              value={stats.totalUsers}
              variant="default"
            />
            <StatCard
              icon="🎨"
              label="Creators"
              value={stats.usersByRole.creator}
              variant="default"
            />
            <StatCard
              icon="📹"
              label="Total Content"
              value={stats.totalContent}
              variant="default"
            />
            <StatCard
              icon="⏳"
              label="Pending"
              value={stats.pendingContent}
              variant={stats.pendingContent > 0 ? 'warning' : 'default'}
              onPress={() => navigation.navigate('ContentModeration')}
            />
          </View>

          {/* User Breakdown */}
          <Text style={styles.sectionTitle}>User Breakdown</Text>
          <View style={styles.breakdownCard}>
            <BreakdownRow icon="👤" label="Regular Users" value={stats.usersByRole.user} />
            <BreakdownRow icon="🎨" label="Creators" value={stats.usersByRole.creator} />
            <BreakdownRow icon="🛡️" label="Admins" value={stats.usersByRole.admin} />
            <View style={styles.breakdownDivider} />
            <BreakdownRow
              icon="⚠️"
              label="Suspended"
              value={stats.suspendedUsers}
              highlight={stats.suspendedUsers > 0}
            />
          </View>

          {/* Content Breakdown */}
          <Text style={styles.sectionTitle}>Content Status</Text>
          <View style={styles.breakdownCard}>
            <BreakdownRow
              icon="⏳"
              label="Pending Review"
              value={stats.contentByStatus.pending}
              highlight={stats.contentByStatus.pending > 0}
            />
            <BreakdownRow icon="✅" label="Published" value={stats.contentByStatus.published} />
            <BreakdownRow icon="❌" label="Rejected" value={stats.contentByStatus.rejected} />
            <BreakdownRow icon="🗑️" label="Removed" value={stats.contentByStatus.removed} />
          </View>

          {/* Activity Summary */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityValue}>{stats.recentActions}</Text>
            <Text style={styles.activityLabel}>moderation actions</Text>
            <Text style={styles.activityPeriod}>in the last 24 hours</Text>
          </View>
        </>
      )}

      {/* Inline Error */}
      {error && stats && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}
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
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertWarning: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  alertDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  alertBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertBadgeWarning: {
    backgroundColor: '#F59E0B',
  },
  alertBadgeDanger: {
    backgroundColor: '#EF4444',
  },
  alertBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertTitleWarning: {
    color: '#F59E0B',
  },
  alertTitleDanger: {
    color: '#EF4444',
  },
  alertSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  alertSubtitleWarning: {
    color: 'rgba(245,158,11,0.8)',
  },
  alertSubtitleDanger: {
    color: 'rgba(239,68,68,0.8)',
  },
  alertArrow: {
    fontSize: 18,
    marginLeft: 8,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  actionSublabel: {
    fontSize: 11,
    color: darkTheme.semantic.textSecondary,
    marginTop: 2,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCardWrap: {
    width: '50%',
    padding: 4,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.semantic.text,
  },
  statLabel: {
    fontSize: 13,
    color: darkTheme.semantic.textSecondary,
    marginTop: 2,
  },
  statSublabel: {
    fontSize: 11,
    color: darkTheme.semantic.textTertiary,
    marginTop: 2,
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: darkTheme.semantic.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  breakdownIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  breakdownValueHighlight: {
    color: '#F59E0B',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: darkTheme.semantic.border,
    marginHorizontal: 12,
  },

  // Activity Card
  activityCard: {
    backgroundColor: darkTheme.semantic.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  activityValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3EA6FF',
  },
  activityLabel: {
    fontSize: 16,
    color: darkTheme.semantic.text,
    marginTop: 4,
  },
  activityPeriod: {
    fontSize: 13,
    color: darkTheme.semantic.textSecondary,
    marginTop: 4,
  },

  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },

  // Access Denied
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: darkTheme.semantic.background,
  },
  accessDeniedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 15,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
  },
});
