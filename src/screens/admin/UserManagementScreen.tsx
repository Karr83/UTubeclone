/**
 * User Management Screen
 * 
 * Admin screen for managing users with table-like UI.
 * Supports filtering, suspension/unsuspension actions.
 * 
 * YouTube-style dark theme with admin accent.
 * 
 * TODO Phase 3: Add user search
 * TODO Phase 3: Add bulk actions
 * TODO Phase 3: Add user detail modal
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import { UserRole } from '../../types/auth';
import {
  AdminUserView,
  UserStatus,
  SuspensionReason,
} from '../../types/admin';
import { LoadingView, ErrorView, EmptyState } from '../../components/common';
import { darkTheme } from '../../theme';

// =============================================================================
// CONSTANTS
// =============================================================================

const SUSPENSION_REASONS: { key: SuspensionReason; label: string; icon: string }[] = [
  { key: 'policy_violation', label: 'Policy Violation', icon: '📜' },
  { key: 'inappropriate_content', label: 'Inappropriate Content', icon: '🚫' },
  { key: 'harassment', label: 'Harassment', icon: '😠' },
  { key: 'spam', label: 'Spam', icon: '📧' },
  { key: 'fraudulent_activity', label: 'Fraudulent Activity', icon: '💳' },
  { key: 'multiple_violations', label: 'Multiple Violations', icon: '⚠️' },
  { key: 'other', label: 'Other', icon: '📝' },
];

type FilterRole = UserRole | 'all';
type FilterStatus = UserStatus | 'all';

// =============================================================================
// FILTER CHIP COMPONENT
// =============================================================================

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
}

function FilterChip({ label, isActive, onPress, count }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// USER ROW COMPONENT
// =============================================================================

interface UserRowProps {
  user: AdminUserView;
  onSuspend: () => void;
  onUnsuspend: () => void;
  isCurrentAdmin: boolean;
}

function UserRow({ user, onSuspend, onUnsuspend, isCurrentAdmin }: UserRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', label: 'Admin' };
      case 'creator':
        return { bg: 'rgba(145,71,255,0.15)', color: '#9147FF', label: 'Creator' };
      default:
        return { bg: 'rgba(62,166,255,0.15)', color: '#3EA6FF', label: 'User' };
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'suspended':
        return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'Suspended' };
      case 'banned':
        return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', label: 'Banned' };
      default:
        return { bg: 'rgba(43,166,64,0.15)', color: '#2BA640', label: 'Active' };
    }
  };

  const roleBadge = getRoleBadge(user.role);
  const statusBadge = getStatusBadge(user.status);

  return (
    <View style={styles.userRow}>
      {/* Main Row */}
      <TouchableOpacity style={styles.userRowMain} onPress={() => setExpanded(!expanded)}>
        {/* Avatar */}
        <View style={[styles.avatar, user.role === 'admin' && styles.avatarAdmin]}>
          <Text style={styles.avatarText}>
            {user.email?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            {isCurrentAdmin && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          {user.displayName && (
            <Text style={styles.userName}>{user.displayName}</Text>
          )}
          <Text style={styles.userId}>ID: {user.uid.slice(0, 12)}...</Text>
        </View>

        {/* Badges */}
        <View style={styles.badgesCol}>
          <View style={[styles.badge, { backgroundColor: roleBadge.bg }]}>
            <Text style={[styles.badgeText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
            <Text style={[styles.badgeText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
          </View>
        </View>

        {/* Expand Arrow */}
        <Text style={styles.expandArrow}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Joined</Text>
              <Text style={styles.statValue}>{user.createdAt.toLocaleDateString()}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Warnings</Text>
              <Text style={[styles.statValue, user.warningCount > 0 && styles.statValueWarning]}>
                {user.warningCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Removed Content</Text>
              <Text style={[styles.statValue, user.removedContentCount > 0 && styles.statValueDanger]}>
                {user.removedContentCount}
              </Text>
            </View>
          </View>

          {/* Suspension Info */}
          {user.status === 'suspended' && (
            <View style={styles.suspensionBox}>
              <Text style={styles.suspensionTitle}>⚠️ Suspension Details</Text>
              {user.suspensionReason && (
                <Text style={styles.suspensionText}>
                  Reason: {SUSPENSION_REASONS.find(r => r.key === user.suspensionReason)?.label}
                </Text>
              )}
              {user.suspendedAt && (
                <Text style={styles.suspensionText}>
                  Since: {user.suspendedAt.toLocaleDateString()}
                </Text>
              )}
              {user.suspensionExpiresAt && (
                <Text style={styles.suspensionText}>
                  Expires: {user.suspensionExpiresAt.toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {!isCurrentAdmin && user.role !== 'admin' && (
            <View style={styles.actionsRow}>
              {user.status === 'active' && (
                <TouchableOpacity style={styles.suspendButton} onPress={onSuspend}>
                  <Text style={styles.suspendButtonText}>⏸️ Suspend User</Text>
                </TouchableOpacity>
              )}
              {user.status === 'suspended' && (
                <TouchableOpacity style={styles.unsuspendButton} onPress={onUnsuspend}>
                  <Text style={styles.unsuspendButtonText}>▶️ Unsuspend User</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function UserManagementScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<SuspensionReason | null>(null);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadUsers = useCallback(async () => {
    try {
      const options: any = {};
      if (roleFilter !== 'all') options.role = roleFilter;
      if (statusFilter !== 'all') options.status = statusFilter;
      
      const response = await adminService.getAllUsers(options);
      setUsers(response.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  // ---------------------------------------------------------------------------
  // COUNTS
  // ---------------------------------------------------------------------------

  const getCounts = () => {
    return {
      all: users.length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
    };
  };

  // ---------------------------------------------------------------------------
  // USER ACTIONS
  // ---------------------------------------------------------------------------

  const handleSuspendPress = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedReason(null);
    setSuspendModalVisible(true);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedUserId || !selectedReason || !user?.uid || !profile?.email) return;

    try {
      await adminService.suspendUser(selectedUserId, user.uid, profile.email, selectedReason);
      setSuspendModalVisible(false);
      Alert.alert('Success', 'User suspended successfully');
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspend = async (userId: string) => {
    if (!user?.uid || !profile?.email) return;

    Alert.alert(
      'Unsuspend User',
      'Are you sure you want to restore this user\'s access?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsuspend',
          onPress: async () => {
            try {
              await adminService.unsuspendUser(userId, user.uid, profile.email);
              Alert.alert('Success', 'User access restored');
              loadUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to unsuspend user');
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // ACCESS CONTROL
  // ---------------------------------------------------------------------------

  if (profile?.role !== 'admin') {
    return (
      <View style={[styles.accessDenied, { paddingTop: insets.top }]}>
        <Text style={styles.accessDeniedEmoji}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Admin Access Required</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingView fullScreen message="Loading users..." />;
  }

  if (error && users.length === 0) {
    return <ErrorView error={error} onRetry={loadUsers} fullScreen />;
  }

  const counts = getCounts();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>{users.length} users</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Role</Text>
          <View style={styles.filterChips}>
            <FilterChip label="All" isActive={roleFilter === 'all'} onPress={() => setRoleFilter('all')} />
            <FilterChip label="Users" isActive={roleFilter === 'user'} onPress={() => setRoleFilter('user')} />
            <FilterChip label="Creators" isActive={roleFilter === 'creator'} onPress={() => setRoleFilter('creator')} />
            <FilterChip label="Admins" isActive={roleFilter === 'admin'} onPress={() => setRoleFilter('admin')} />
          </View>
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterChips}>
            <FilterChip label="All" isActive={statusFilter === 'all'} onPress={() => setStatusFilter('all')} count={counts.all} />
            <FilterChip label="Active" isActive={statusFilter === 'active'} onPress={() => setStatusFilter('active')} count={counts.active} />
            <FilterChip label="Suspended" isActive={statusFilter === 'suspended'} onPress={() => setStatusFilter('suspended')} count={counts.suspended} />
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            onSuspend={() => handleSuspendPress(item.uid)}
            onUnsuspend={() => handleUnsuspend(item.uid)}
            isCurrentAdmin={item.uid === user?.uid}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="No Users Found"
            message="No users match the current filters."
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Suspension Modal */}
      <Modal
        visible={suspendModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuspendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Suspension Reason</Text>
            
            {SUSPENSION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={[styles.reasonOption, selectedReason === reason.key && styles.reasonOptionSelected]}
                onPress={() => setSelectedReason(reason.key)}
              >
                <Text style={styles.reasonIcon}>{reason.icon}</Text>
                <Text style={[styles.reasonText, selectedReason === reason.key && styles.reasonTextSelected]}>
                  {reason.label}
                </Text>
                {selectedReason === reason.key && <Text style={styles.reasonCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setSuspendModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, !selectedReason && styles.modalButtonDisabled]}
                onPress={handleSuspendConfirm}
                disabled={!selectedReason}
              >
                <Text style={styles.modalConfirmText}>Suspend User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Filters
  filtersSection: {
    backgroundColor: darkTheme.semantic.surface,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.border,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: darkTheme.semantic.textTertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.chipBackground,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: darkTheme.youtube.chipActive,
  },
  filterChipText: {
    fontSize: 13,
    color: darkTheme.semantic.text,
  },
  filterChipTextActive: {
    color: darkTheme.youtube.chipActiveText,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  filterBadgeTextActive: {
    color: darkTheme.youtube.chipActiveText,
  },

  // List
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  separator: {
    height: 8,
  },

  // User Row
  userRow: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  userRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3EA6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAdmin: {
    backgroundColor: '#EF4444',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    flex: 1,
  },
  youBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: darkTheme.semantic.textSecondary,
  },
  userName: {
    fontSize: 13,
    color: darkTheme.semantic.textSecondary,
    marginTop: 1,
  },
  userId: {
    fontSize: 11,
    color: darkTheme.semantic.textTertiary,
    marginTop: 2,
  },
  badgesCol: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandArrow: {
    fontSize: 10,
    color: darkTheme.semantic.textTertiary,
    marginLeft: 8,
  },

  // Expanded Content
  expandedContent: {
    backgroundColor: darkTheme.semantic.surfaceElevated,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: darkTheme.semantic.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: darkTheme.semantic.textTertiary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginTop: 2,
  },
  statValueWarning: {
    color: '#F59E0B',
  },
  statValueDanger: {
    color: '#EF4444',
  },
  suspensionBox: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  suspensionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 6,
  },
  suspensionText: {
    fontSize: 12,
    color: 'rgba(245,158,11,0.8)',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suspendButton: {
    flex: 1,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  suspendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  unsuspendButton: {
    flex: 1,
    backgroundColor: 'rgba(43,166,64,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  unsuspendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2BA640',
  },

  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: darkTheme.semantic.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: darkTheme.semantic.surfaceElevated,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  reasonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: darkTheme.semantic.text,
  },
  reasonTextSelected: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  reasonCheck: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: darkTheme.semantic.surfaceElevated,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    textAlign: 'center',
  },
});
