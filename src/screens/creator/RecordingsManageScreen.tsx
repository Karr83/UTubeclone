/**
 * Recordings Manage Screen (Creator)
 * 
 * This screen allows creators to manage their recorded streams.
 * Includes listing, editing, and deleting recordings.
 * 
 * FEATURES:
 * - List creator's recordings
 * - Edit recording details
 * - Delete recordings
 * - Change visibility settings
 * 
 * NOTE: This is a minimal implementation without styling per requirements.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useRecording } from '../../hooks/useRecording';
import {
  Recording,
  RecordingVisibility,
  UpdateRecordingData,
} from '../../types/recording';
import { formatDuration, formatFileSize } from '../../services/recording.service';

// =============================================================================
// EDIT MODAL COMPONENT
// =============================================================================

interface EditModalProps {
  visible: boolean;
  recording: Recording | null;
  onClose: () => void;
  onSave: (recordingId: string, data: UpdateRecordingData) => Promise<boolean>;
}

function EditModal({ visible, recording, onClose, onSave }: EditModalProps): JSX.Element {
  const [title, setTitle] = useState(recording?.title || '');
  const [description, setDescription] = useState(recording?.description || '');
  const [visibility, setVisibility] = useState<RecordingVisibility>(
    recording?.visibility || 'public'
  );
  const [isSaving, setIsSaving] = useState(false);
  
  // Update state when recording changes
  React.useEffect(() => {
    if (recording) {
      setTitle(recording.title);
      setDescription(recording.description || '');
      setVisibility(recording.visibility);
    }
  }, [recording]);
  
  const handleSave = async () => {
    if (!recording || !title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    
    setIsSaving(true);
    
    const success = await onSave(recording.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      visibility,
    });
    
    setIsSaving(false);
    
    if (success) {
      onClose();
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} disabled={isSaving}>
            <Text style={modalStyles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>Edit Recording</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={modalStyles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={modalStyles.content}>
          {/* Title */}
          <Text style={modalStyles.label}>Title</Text>
          <TextInput
            style={modalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Recording title"
            placeholderTextColor="#6B7280"
            maxLength={100}
          />
          
          {/* Description */}
          <Text style={modalStyles.label}>Description</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor="#6B7280"
            maxLength={500}
            multiline
            numberOfLines={4}
          />
          
          {/* Visibility */}
          <Text style={modalStyles.label}>Visibility</Text>
          <View style={modalStyles.visibilityOptions}>
            <TouchableOpacity
              style={[
                modalStyles.visibilityOption,
                visibility === 'public' && modalStyles.visibilitySelected,
              ]}
              onPress={() => setVisibility('public')}
            >
              <Text style={modalStyles.visibilityEmoji}>🌍</Text>
              <Text style={modalStyles.visibilityText}>Public</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                modalStyles.visibilityOption,
                visibility === 'members' && modalStyles.visibilitySelected,
              ]}
              onPress={() => setVisibility('members')}
            >
              <Text style={modalStyles.visibilityEmoji}>🔒</Text>
              <Text style={modalStyles.visibilityText}>Members</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                modalStyles.visibilityOption,
                visibility === 'private' && modalStyles.visibilitySelected,
              ]}
              onPress={() => setVisibility('private')}
            >
              <Text style={modalStyles.visibilityEmoji}>👁️</Text>
              <Text style={modalStyles.visibilityText}>Private</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  visibilitySelected: {
    borderColor: '#007AFF',
    backgroundColor: '#1E3A5F',
  },
  visibilityEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  visibilityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

// =============================================================================
// RECORDING ROW COMPONENT
// =============================================================================

interface RecordingRowProps {
  recording: Recording;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

function RecordingRow({ recording, onEdit, onDelete, onView }: RecordingRowProps): JSX.Element {
  const isReady = recording.status === 'ready';
  const isProcessing = recording.status === 'processing' || recording.status === 'pending';
  const isFailed = recording.status === 'failed';
  
  const getStatusBadge = () => {
    switch (recording.status) {
      case 'ready':
        return { bg: '#22C55E', text: 'Ready' };
      case 'processing':
        return { bg: '#F59E0B', text: 'Processing' };
      case 'pending':
        return { bg: '#6B7280', text: 'Pending' };
      case 'failed':
        return { bg: '#EF4444', text: 'Failed' };
      case 'deleted':
        return { bg: '#7F1D1D', text: 'Deleted' };
      default:
        return { bg: '#6B7280', text: 'Unknown' };
    }
  };
  
  const statusBadge = getStatusBadge();
  
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.main}>
        <View style={rowStyles.info}>
          <Text style={rowStyles.title} numberOfLines={1}>
            {recording.title}
          </Text>
          
          <View style={rowStyles.metaRow}>
            <View style={[rowStyles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={rowStyles.statusText}>{statusBadge.text}</Text>
            </View>
            
            {isReady && (
              <>
                <Text style={rowStyles.metaText}>
                  {formatDuration(recording.durationSeconds)}
                </Text>
                <Text style={rowStyles.metaText}>•</Text>
                <Text style={rowStyles.metaText}>
                  {recording.viewCount} views
                </Text>
              </>
            )}
          </View>
          
          <Text style={rowStyles.dateText}>
            {recording.createdAt.toLocaleDateString()}
          </Text>
        </View>
        
        {/* Visibility indicator */}
        <Text style={rowStyles.visibility}>
          {recording.visibility === 'public' ? '🌍' : 
           recording.visibility === 'members' ? '🔒' : '👁️'}
        </Text>
      </View>
      
      {/* Actions */}
      <View style={rowStyles.actions}>
        {isReady && (
          <TouchableOpacity style={rowStyles.actionButton} onPress={onView}>
            <Text style={rowStyles.actionText}>▶️ Watch</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={rowStyles.actionButton} onPress={onEdit}>
          <Text style={rowStyles.actionText}>✏️ Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[rowStyles.actionButton, rowStyles.deleteButton]}
          onPress={onDelete}
        >
          <Text style={rowStyles.actionText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 11,
  },
  visibility: {
    fontSize: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RecordingsManageScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  
  const {
    recordings,
    isLoading,
    isRefreshing,
    error,
    updateRecording,
    deleteRecording,
    refresh,
    loadMore,
    hasMore,
  } = useRecording();
  
  // Edit modal state
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  
  const handleEdit = useCallback((recording: Recording) => {
    setEditingRecording(recording);
    setIsEditModalVisible(true);
  }, []);
  
  const handleSaveEdit = useCallback(async (
    recordingId: string,
    data: UpdateRecordingData
  ): Promise<boolean> => {
    return await updateRecording(recordingId, data);
  }, [updateRecording]);
  
  const handleDelete = useCallback((recording: Recording) => {
    deleteRecording(recording.id, 'Deleted by creator');
  }, [deleteRecording]);
  
  const handleView = useCallback((recording: Recording) => {
    navigation.navigate('Replay', { recordingId: recording.id });
  }, [navigation]);
  
  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading recordings...</Text>
        </View>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: EMPTY
  // ---------------------------------------------------------------------------
  
  if (recordings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📼</Text>
          <Text style={styles.emptyTitle}>No Recordings</Text>
          <Text style={styles.emptyText}>
            Your recorded streams will appear here. Start streaming to create recordings!
          </Text>
        </View>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: LIST
  // ---------------------------------------------------------------------------
  
  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordingRow
            recording={item}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            onView={() => handleView(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#007AFF"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Recordings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your recorded streams
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
      />
      
      {/* Edit Modal */}
      <EditModal
        visible={isEditModalVisible}
        recording={editingRecording}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingRecording(null);
        }}
        onSave={handleSaveEdit}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  
  // Header
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  
  // List
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
  },
});

