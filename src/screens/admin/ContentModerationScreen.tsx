/**
 * Content Moderation Screen
 * 
 * Admin screen for reviewing and moderating content queue.
 * Supports approve, reject, and remove actions with reasons.
 * 
 * YouTube-style dark theme with queue management UI.
 * 
 * TODO Phase 3: Add bulk moderation actions
 * TODO Phase 3: Add content preview modal
 * TODO Phase 3: Add moderation history
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
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import {
  AdminContentView,
  ModerationStatus,
  RejectionReason,
} from '../../types/admin';
import { LoadingView, ErrorView, EmptyState } from '../../components/common';
import { darkTheme } from '../../theme';

// =============================================================================
// CONSTANTS
// =============================================================================

const REJECTION_REASONS: { key: RejectionReason; label: string; icon: string }[] = [
  { key: 'inappropriate_content', label: 'Inappropriate Content', icon: '🚫' },
  { key: 'copyright_violation', label: 'Copyright Violation', icon: '©️' },
  { key: 'spam', label: 'Spam', icon: '📧' },
  { key: 'misleading', label: 'Misleading Content', icon: '⚠️' },
  { key: 'low_quality', label: 'Low Quality', icon: '📉' },
  { key: 'policy_violation', label: 'Policy Violation', icon: '📜' },
  { key: 'other', label: 'Other', icon: '📝' },
];

const STATUS_TABS: { key: ModerationStatus | 'all'; label: string; icon: string }[] = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'published', label: 'Published', icon: '✅' },
  { key: 'rejected', label: 'Rejected', icon: '❌' },
  { key: 'removed', label: 'Removed', icon: '🗑️' },
  { key: 'all', label: 'All', icon: '📋' },
];

// =============================================================================
// TAB COMPONENT
// =============================================================================

interface TabProps {
  label: string;
  icon: string;
  isActive: boolean;
  count?: number;
  onPress: () => void;
}

function Tab({ label, icon, isActive, count, onPress }: TabProps) {
  return (
    <TouchableOpacity
      style={[styles.tab, isActive && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// CONTENT CARD COMPONENT
// =============================================================================

interface ContentCardProps {
  content: AdminContentView;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
}

function ContentCard({ content, onApprove, onReject, onRemove }: ContentCardProps) {
  const getStatusConfig = (status: ModerationStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'PENDING', icon: '⏳' };
      case 'published':
        return { bg: 'rgba(43,166,64,0.15)', color: '#2BA640', label: 'PUBLISHED', icon: '✅' };
      case 'rejected':
        return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', label: 'REJECTED', icon: '❌' };
      case 'removed':
        return { bg: 'rgba(113,113,113,0.15)', color: '#717171', label: 'REMOVED', icon: '🗑️' };
      default:
        return { bg: 'rgba(113,113,113,0.15)', color: '#717171', label: status.toUpperCase(), icon: '📄' };
    }
  };

  const statusConfig = getStatusConfig(content.status);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.contentCard}>
      {/* Thumbnail Row */}
      <View style={styles.cardRow}>
        <View style={styles.thumbWrap}>
          {content.mediaUrl || content.thumbnailUrl ? (
            <Image
              source={{ uri: content.thumbnailUrl || content.mediaUrl }}
              style={styles.thumb}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbEmoji}>
                {content.mediaType === 'video' ? '🎬' : '📷'}
              </Text>
            </View>
          )}
          <View style={[styles.statusOverlay, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusOverlayText, { color: statusConfig.color }]}>
              {statusConfig.icon} {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{content.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{content.mediaType}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{content.visibility}</Text>
            </View>
          </View>

          <Text style={styles.cardMeta}>
            ID: {content.id.slice(0, 10)}... • {formatDate(content.createdAt)}
          </Text>
        </View>
      </View>

      {/* Rejection Info */}
      {content.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionReason}>
            {REJECTION_REASONS.find(r => r.key === content.rejectionReason)?.icon}{' '}
            {REJECTION_REASONS.find(r => r.key === content.rejectionReason)?.label || content.rejectionReason}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {content.status === 'pending' && (
          <>
            <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
              <Text style={styles.approveButtonText}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
              <Text style={styles.rejectButtonText}>✕ Reject</Text>
            </TouchableOpacity>
          </>
        )}
        
        {content.status === 'published' && (
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeButtonText}>🗑️ Remove</Text>
          </TouchableOpacity>
        )}

        {(content.status === 'rejected' || content.status === 'removed') && (
          <TouchableOpacity style={styles.restoreButton} onPress={onApprove}>
            <Text style={styles.restoreButtonText}>↻ Restore & Publish</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ContentModerationScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [content, setContent] = useState<AdminContentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ModerationStatus | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadContent = useCallback(async () => {
    try {
      const options = activeTab === 'all' ? {} : { moderationStatus: activeTab };
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
      'This content will be published and visible to users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await adminService.approveContent(contentId, user.uid, profile.email);
              Alert.alert('Success', 'Content approved and published');
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
      await adminService.rejectContent(selectedContentId, user.uid, profile.email, selectedReason);
      setRejectModalVisible(false);
      Alert.alert('Content Rejected', 'The creator will be notified.');
      loadContent();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject content');
    }
  };

  const handleRemove = async (contentId: string) => {
    if (!user?.uid || !profile?.email) return;

    Alert.alert(
      'Remove Content',
      'This will remove the content from public view.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.removeContent(contentId, user.uid, profile.email, 'policy_violation');
              Alert.alert('Content Removed', 'The creator will be notified.');
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
      <View style={[styles.accessDenied, { paddingTop: insets.top }]}>
        <Text style={styles.accessDeniedEmoji}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Admin Access Required</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // COUNTS
  // ---------------------------------------------------------------------------

  const getPendingCount = () => {
    // Only show count for pending tab when on other tabs
    if (activeTab === 'pending') return undefined;
    return content.filter(c => c.status === 'pending').length;
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingView fullScreen message="Loading content queue..." />;
  }

  if (error && content.length === 0) {
    return <ErrorView error={error} onRetry={loadContent} fullScreen />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Content Moderation</Text>
        <Text style={styles.subtitle}>{content.length} items</Text>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <Tab
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.key}
            count={tab.key === 'pending' ? getPendingCount() : undefined}
            onPress={() => setActiveTab(tab.key)}
          />
        ))}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={content}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard
            content={item}
            onApprove={() => handleApprove(item.id)}
            onReject={() => handleRejectPress(item.id)}
            onRemove={() => handleRemove(item.id)}
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
            icon={activeTab === 'pending' ? '✅' : '📭'}
            title={activeTab === 'pending' ? 'All Caught Up!' : 'No Content'}
            message={
              activeTab === 'pending'
                ? 'No content is waiting for review.'
                : `No ${activeTab} content found.`
            }
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Rejection Reason</Text>
            <Text style={styles.modalSubtitle}>The creator will be notified with this reason.</Text>
            
            {REJECTION_REASONS.map((reason) => (
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
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, !selectedReason && styles.modalButtonDisabled]}
                onPress={handleRejectConfirm}
                disabled={!selectedReason}
              >
                <Text style={styles.modalConfirmText}>Reject Content</Text>
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

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: darkTheme.semantic.surface,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  tabIcon: {
    fontSize: 12,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: darkTheme.semantic.textSecondary,
  },
  tabTextActive: {
    color: '#EF4444',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tabBadgeActive: {
    backgroundColor: '#F59E0B',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },

  // Content Card
  contentCard: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  cardRow: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbWrap: {
    width: 140,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: darkTheme.semantic.surfaceElevated,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: {
    fontSize: 28,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  metaChip: {
    backgroundColor: darkTheme.semantic.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  metaChipText: {
    fontSize: 11,
    color: darkTheme.semantic.textSecondary,
    textTransform: 'capitalize',
  },
  cardMeta: {
    fontSize: 11,
    color: darkTheme.semantic.textTertiary,
  },

  // Rejection Box
  rejectionBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 11,
    color: 'rgba(239,68,68,0.7)',
    marginBottom: 2,
  },
  rejectionReason: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: 'rgba(43,166,64,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2BA640',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  removeButton: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  restoreButton: {
    flex: 1,
    backgroundColor: 'rgba(62,166,255,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3EA6FF',
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
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
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
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
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
    color: '#EF4444',
    fontWeight: '600',
  },
  reasonCheck: {
    fontSize: 16,
    color: '#EF4444',
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
    backgroundColor: '#EF4444',
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
