/**
 * User Management Screen
 * 
 * Admin screen for managing users:
 * - View all users
 * - Suspend/unsuspend users
 * - Filter by role or status
 * - View user details
 * 
 * SUSPENSION WORKFLOW:
 * 1. Admin selects user to suspend
 * 2. Admin chooses suspension reason
 * 3. User status changes to 'suspended'
 * 4. Suspended users cannot upload content
 * 
 * ACCESS CONTROL:
 * - Only accessible to users with role='admin'
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import { UserRole } from '../../types/auth';
import {
  AdminUserView,
  UserStatus,
  SuspensionReason,
} from '../../types/admin';

// =============================================================================
// SUSPENSION REASONS
// =============================================================================

const SUSPENSION_REASONS: { key: SuspensionReason; label: string }[] = [
  { key: 'policy_violation', label: 'Policy Violation' },
  { key: 'inappropriate_content', label: 'Inappropriate Content' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'spam', label: 'Spam' },
  { key: 'fraudulent_activity', label: 'Fraudulent Activity' },
  { key: 'multiple_violations', label: 'Multiple Violations' },
  { key: 'other', label: 'Other' },
];

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const ROLE_FILTERS: { key: UserRole | 'all'; label: string }[] = [
  { key: 'all', label: 'All Roles' },
  { key: 'user', label: 'Users' },
  { key: 'creator', label: 'Creators' },
  { key: 'admin', label: 'Admins' },
];

const STATUS_FILTERS: { key: UserStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'banned', label: 'Banned' },
];

// =============================================================================
// USER CARD COMPONENT
// =============================================================================

interface UserCardProps {
  user: AdminUserView;
  onSuspend: (userId: string) => void;
  onUnsuspend: (userId: string) => void;
  currentAdminId: string;
}

function UserCard({
  user,
  onSuspend,
  onUnsuspend,
  currentAdminId,
}: UserCardProps): JSX.Element {
  const roleColors: Record<string, { bg: string; text: string }> = {
    user: { bg: '#DBEAFE', text: '#1D4ED8' },
    creator: { bg: '#E0E7FF', text: '#4338CA' },
    admin: { bg: '#FEE2E2', text: '#DC2626' },
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#D1FAE5', text: '#059669' },
    suspended: { bg: '#FEF3C7', text: '#D97706' },
    banned: { bg: '#FEE2E2', text: '#DC2626' },
  };

  const roleStyle = roleColors[user.role] || roleColors.user;
  const statusStyle = statusColors[user.status] || statusColors.active;

  const isCurrentAdmin = user.uid === currentAdminId;

  return (
    <View style={styles.card}>
      {/* User Info */}
      <View style={styles.cardHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {user.email?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user.email}
          </Text>
          {user.displayName && (
            <Text style={styles.userName}>{user.displayName}</Text>
          )}
          <Text style={styles.userId}>ID: {user.uid.slice(0, 12)}...</Text>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: roleStyle.bg }]}>
          <Text style={[styles.badgeText, { color: roleStyle.text }]}>
            {user.role.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {user.status.toUpperCase()}
          </Text>
        </View>
        {isCurrentAdmin && (
          <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.badgeText, { color: '#6B7280' }]}>YOU</Text>
          </View>
        )}
      </View>

      {/* User Details */}
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>
          Joined: {user.createdAt.toLocaleDateString()}
        </Text>
        {user.warningCount > 0 && (
          <Text style={styles.warningText}>
            ⚠️ Warnings: {user.warningCount}
          </Text>
        )}
        {user.removedContentCount > 0 && (
          <Text style={styles.removedText}>
            🗑️ Removed content: {user.removedContentCount}
          </Text>
        )}
      </View>

      {/* Suspension Info */}
      {user.status === 'suspended' && (
        <View style={styles.suspensionInfo}>
          <Text style={styles.suspensionTitle}>Suspension Details</Text>
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

      {/* Action Buttons - Don't allow admins to suspend themselves */}
      {!isCurrentAdmin && user.role !== 'admin' && (
        <View style={styles.cardActions}>
          {user.status === 'active' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.suspendButton]}
              onPress={() => onSuspend(user.uid)}
            >
              <Text style={styles.suspendButtonText}>⏸️ Suspend</Text>
            </TouchableOpacity>
          )}
          
          {user.status === 'suspended' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.unsuspendButton]}
              onPress={() => onUnsuspend(user.uid)}
            >
              <Text style={styles.unsuspendButtonText}>▶️ Unsuspend</Text>
            </TouchableOpacity>
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
  const { user, profile } = useAuth();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Suspension modal state
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
      await adminService.suspendUser(
        selectedUserId,
        user.uid,
        profile.email,
        selectedReason
      );
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
      'Are you sure you want to unsuspend this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsuspend',
          onPress: async () => {
            try {
              await adminService.unsuspendUser(userId, user.uid, profile.email);
              Alert.alert('Success', 'User unsuspended successfully');
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
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedEmoji}>🚫</Text>
        <Text style={styles.accessDeniedTitle}>Admin Access Only</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER EMPTY STATE
  // ---------------------------------------------------------------------------

  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>No Users Found</Text>
        <Text style={styles.emptyText}>
          No users match the current filters.
        </Text>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          {users.length} user{users.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {/* Role Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Role:</Text>
          <View style={styles.filterOptions}>
            {ROLE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  roleFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => setRoleFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    roleFilter === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterOptions}>
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  statusFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* User List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onSuspend={handleSuspendPress}
              onUnsuspend={handleUnsuspend}
              currentAdminId={user?.uid || ''}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#DC2626"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Suspension Reason Modal */}
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
                style={[
                  styles.reasonOption,
                  selectedReason === reason.key && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.key)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.key && styles.reasonTextSelected,
                  ]}
                >
                  {reason.label}
                </Text>
                {selectedReason === reason.key && (
                  <Text style={styles.reasonCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSuspendModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  !selectedReason && styles.modalButtonDisabled,
                ]}
                onPress={handleSuspendConfirm}
                disabled={!selectedReason}
              >
                <Text style={styles.modalConfirmText}>Suspend</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FECACA',
    marginTop: 4,
  },

  // Filters
  filters: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userName: {
    fontSize: 14,
    color: '#6B7280',
  },
  userId: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Badges
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Details
  cardDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    color: '#D97706',
    marginTop: 4,
  },
  removedText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 2,
  },

  // Suspension Info
  suspensionInfo: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  suspensionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  suspensionText: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },

  // Actions
  cardActions: {
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  suspendButton: {
    backgroundColor: '#FEF3C7',
  },
  suspendButtonText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 14,
  },
  unsuspendButton: {
    backgroundColor: '#D1FAE5',
  },
  unsuspendButtonText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  reasonText: {
    fontSize: 16,
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#D97706',
    fontWeight: '600',
  },
  reasonCheck: {
    fontSize: 18,
    color: '#D97706',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#D97706',
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
  },
});

