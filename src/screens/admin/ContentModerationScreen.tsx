/**
 * Content Moderation Screen
 * 
 * Admin screen for reviewing and moderating content.
 * 
 * FEATURES:
 * - View pending content queue
 * - Approve/reject/remove content
 * - Filter by status
 * - View content details
 * 
 * MODERATION WORKFLOW:
 * 1. New content appears with status 'pending'
 * 2. Admin reviews content details
 * 3. Admin takes action:
 *    - Approve → status becomes 'published'
 *    - Reject → status becomes 'rejected' (with reason)
 *    - Remove → status becomes 'removed' (for published content)
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
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import {
  AdminContentView,
  ModerationStatus,
  RejectionReason,
} from '../../types/admin';

// =============================================================================
// REJECTION REASONS
// =============================================================================

const REJECTION_REASONS: { key: RejectionReason; label: string }[] = [
  { key: 'inappropriate_content', label: 'Inappropriate Content' },
  { key: 'copyright_violation', label: 'Copyright Violation' },
  { key: 'spam', label: 'Spam' },
  { key: 'misleading', label: 'Misleading Content' },
  { key: 'low_quality', label: 'Low Quality' },
  { key: 'policy_violation', label: 'Policy Violation' },
  { key: 'other', label: 'Other' },
];

// =============================================================================
// STATUS FILTER TABS
// =============================================================================

const STATUS_TABS: { key: ModerationStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'removed', label: 'Removed' },
  { key: 'all', label: 'All' },
];

// =============================================================================
// CONTENT CARD COMPONENT
// =============================================================================

interface ContentCardProps {
  content: AdminContentView;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
}

function ContentCard({
  content,
  onApprove,
  onReject,
  onRemove,
}: ContentCardProps): JSX.Element {
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    published: { bg: '#D1FAE5', text: '#059669' },
    rejected: { bg: '#FEE2E2', text: '#DC2626' },
    removed: { bg: '#F3F4F6', text: '#6B7280' },
  };

  const statusStyle = statusColors[content.status] || statusColors.pending;

  return (
    <View style={styles.card}>
      {/* Media Preview */}
      <View style={styles.cardMedia}>
        {content.mediaUrl ? (
          <Image
            source={{ uri: content.thumbnailUrl || content.mediaUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Text style={styles.placeholderEmoji}>
              {content.mediaType === 'video' ? '🎬' : '📷'}
            </Text>
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {content.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Content Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {content.title}
        </Text>
        
        <Text style={styles.cardMeta}>
          {content.mediaType} • {content.visibility} • ID: {content.id.slice(0, 8)}...
        </Text>

        <Text style={styles.cardDate}>
          Created: {content.createdAt.toLocaleDateString()}
        </Text>

        {content.rejectionReason && (
          <View style={styles.rejectionInfo}>
            <Text style={styles.rejectionLabel}>Rejection reason:</Text>
            <Text style={styles.rejectionReason}>
              {REJECTION_REASONS.find(r => r.key === content.rejectionReason)?.label || content.rejectionReason}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          {content.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => onApprove(content.id)}
              >
                <Text style={styles.approveButtonText}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onReject(content.id)}
              >
                <Text style={styles.rejectButtonText}>✕ Reject</Text>
              </TouchableOpacity>
            </>
          )}
          
          {content.status === 'published' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => onRemove(content.id)}
            >
              <Text style={styles.removeButtonText}>🗑️ Remove</Text>
            </TouchableOpacity>
          )}

          {(content.status === 'rejected' || content.status === 'removed') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.restoreButton]}
              onPress={() => onApprove(content.id)}
            >
              <Text style={styles.restoreButtonText}>↻ Restore</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ContentModerationScreen(): JSX.Element {
  const { user, profile } = useAuth();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [content, setContent] = useState<AdminContentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ModerationStatus | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadContent = useCallback(async () => {
    try {
      const options = activeTab === 'all' 
        ? {} 
        : { moderationStatus: activeTab };
      
      const response = await adminService.getAllContent(options);
      setContent(response.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    loadContent();
  }, [loadContent]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadContent();
  };

  // ---------------------------------------------------------------------------
  // MODERATION ACTIONS
  // ---------------------------------------------------------------------------

  const handleApprove = async (contentId: string) => {
    if (!user?.uid || !profile?.email) return;

    Alert.alert(
      'Approve Content',
      'Are you sure you want to approve this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await adminService.approveContent(contentId, user.uid, profile.email);
              Alert.alert('Success', 'Content approved successfully');
              loadContent();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to approve content');
            }
          },
        },
      ]
    );
  };

  const handleRejectPress = (contentId: string) => {
    setSelectedContentId(contentId);
    setSelectedReason(null);
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedContentId || !selectedReason || !user?.uid || !profile?.email) return;

    try {
      await adminService.rejectContent(
        selectedContentId,
        user.uid,
        profile.email,
        selectedReason
      );
      setRejectModalVisible(false);
      Alert.alert('Success', 'Content rejected');
      loadContent();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject content');
    }
  };

  const handleRemove = async (contentId: string) => {
    if (!user?.uid || !profile?.email) return;

    Alert.alert(
      'Remove Content',
      'Are you sure you want to remove this published content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.removeContent(
                contentId,
                user.uid,
                profile.email,
                'policy_violation'
              );
              Alert.alert('Success', 'Content removed');
              loadContent();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove content');
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
        <Text style={styles.emptyEmoji}>
          {activeTab === 'pending' ? '✅' : '📭'}
        </Text>
        <Text style={styles.emptyTitle}>
          {activeTab === 'pending' ? 'All Caught Up!' : 'No Content'}
        </Text>
        <Text style={styles.emptyText}>
          {activeTab === 'pending'
            ? 'No content is waiting for review.'
            : `No ${activeTab} content found.`}
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
        <Text style={styles.title}>Content Moderation</Text>
        <Text style={styles.subtitle}>
          {content.length} item{content.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContentCard
              content={item}
              onApprove={handleApprove}
              onReject={handleRejectPress}
              onRemove={handleRemove}
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

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Rejection Reason</Text>
            
            {REJECTION_REASONS.map((reason) => (
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
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  !selectedReason && styles.modalButtonDisabled,
                ]}
                onPress={handleRejectConfirm}
                disabled={!selectedReason}
              >
                <Text style={styles.modalConfirmText}>Reject</Text>
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

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
    flexWrap: 'wrap',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#DC2626',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    padding: 16,
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMedia: {
    width: '100%',
    height: 160,
    backgroundColor: '#1F2937',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Rejection Info
  rejectionInfo: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  rejectionLabel: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '500',
  },
  rejectionReason: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
  },
  approveButtonText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  restoreButton: {
    backgroundColor: '#DBEAFE',
  },
  restoreButtonText: {
    color: '#2563EB',
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
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  reasonText: {
    fontSize: 16,
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#DC2626',
    fontWeight: '600',
  },
  reasonCheck: {
    fontSize: 18,
    color: '#DC2626',
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
    backgroundColor: '#DC2626',
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

