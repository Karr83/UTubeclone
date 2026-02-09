/**
 * useRecording Hook
 * 
 * This hook provides recording management functionality for creators.
 * It handles listing, updating, and deleting recordings.
 * 
 * USAGE:
 * ```tsx
 * const {
 *   recordings,
 *   isLoading,
 *   updateRecording,
 *   deleteRecording,
 *   refresh,
 * } = useRecording();
 * ```
 * 
 * FEATURES:
 * - Real-time recording updates
 * - CRUD operations for recordings
 * - Permission-based actions
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
// PHASE 2: Import centralized Firebase mocks
import { getFunctions, httpsCallable } from 'firebase/functions';

import { useAuth } from '../contexts/AuthContext';
import {
  Recording,
  UpdateRecordingData,
  RecordingQueryOptions,
} from '../types/recording';
import {
  getCreatorRecordings,
  updateRecording as updateRecordingService,
  deleteRecording as deleteRecordingService,
  subscribeToCreatorRecordings,
  canManageRecording,
} from '../services/recording.service';

// =============================================================================
// TYPES
// =============================================================================

interface UseRecordingResult {
  /** Creator's recordings */
  recordings: Recording[];
  
  /** Loading state */
  isLoading: boolean;
  
  /** Refreshing state */
  isRefreshing: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Whether user can manage recordings */
  canManage: boolean;
  
  /** Update a recording */
  updateRecording: (recordingId: string, data: UpdateRecordingData) => Promise<boolean>;
  
  /** Delete a recording */
  deleteRecording: (recordingId: string, reason?: string) => Promise<boolean>;
  
  /** Refresh recordings list */
  refresh: () => Promise<void>;
  
  /** Load more recordings */
  loadMore: () => Promise<void>;
  
  /** Whether there are more recordings to load */
  hasMore: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useRecording(): UseRecordingResult {
  const { user, role, profile } = useAuth();
  
  // State
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<string | undefined>(undefined);
  
  // Derived state
  const canManage = role === 'creator' || role === 'admin';
  
  // ---------------------------------------------------------------------------
  // LOAD RECORDINGS
  // ---------------------------------------------------------------------------
  
  const loadRecordings = useCallback(async (refresh = false) => {
    if (!user?.uid) {
      setRecordings([]);
      setIsLoading(false);
      return;
    }
    
    if (refresh) {
      setIsRefreshing(true);
      setLastId(undefined);
    } else {
      setIsLoading(true);
    }
    
    try {
      const options: RecordingQueryOptions = {
        limit: 20,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };
      
      const response = await getCreatorRecordings(user.uid, options);
      
      setRecordings(response.recordings);
      setHasMore(response.hasMore);
      setLastId(response.lastId);
      setError(null);
    } catch (err: any) {
      console.error('[useRecording] Load error:', err);
      setError(err.message || 'Failed to load recordings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);
  
  // Load on mount
  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);
  
  // ---------------------------------------------------------------------------
  // REAL-TIME SUBSCRIPTION
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = subscribeToCreatorRecordings(
      user.uid,
      (updatedRecordings) => {
        setRecordings(updatedRecordings);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [user?.uid]);
  
  // ---------------------------------------------------------------------------
  // LOAD MORE
  // ---------------------------------------------------------------------------
  
  const loadMore = useCallback(async () => {
    if (!user?.uid || !hasMore || !lastId) return;
    
    try {
      const options: RecordingQueryOptions = {
        limit: 20,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        startAfter: lastId,
      };
      
      const response = await getCreatorRecordings(user.uid, options);
      
      setRecordings((prev) => [...prev, ...response.recordings]);
      setHasMore(response.hasMore);
      setLastId(response.lastId);
    } catch (err: any) {
      console.error('[useRecording] Load more error:', err);
    }
  }, [user?.uid, hasMore, lastId]);
  
  // ---------------------------------------------------------------------------
  // UPDATE RECORDING
  // ---------------------------------------------------------------------------
  
  const updateRecording = useCallback(async (
    recordingId: string,
    data: UpdateRecordingData
  ): Promise<boolean> => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in.');
      return false;
    }
    
    // Find recording
    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) {
      Alert.alert('Error', 'Recording not found.');
      return false;
    }
    
    // Check permissions
    if (!canManageRecording(recording, user.uid, role || 'user')) {
      Alert.alert('Error', 'You do not have permission to edit this recording.');
      return false;
    }
    
    try {
      await updateRecordingService(recordingId, data);
      Alert.alert('Success', 'Recording updated.');
      return true;
    } catch (err: any) {
      console.error('[useRecording] Update error:', err);
      Alert.alert('Error', err.message || 'Failed to update recording.');
      return false;
    }
  }, [user?.uid, recordings, role]);
  
  // ---------------------------------------------------------------------------
  // DELETE RECORDING
  // ---------------------------------------------------------------------------
  
  const deleteRecording = useCallback(async (
    recordingId: string,
    reason?: string
  ): Promise<boolean> => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in.');
      return false;
    }
    
    // Find recording
    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) {
      Alert.alert('Error', 'Recording not found.');
      return false;
    }
    
    // Check permissions
    if (!canManageRecording(recording, user.uid, role || 'user')) {
      Alert.alert('Error', 'You do not have permission to delete this recording.');
      return false;
    }
    
    return new Promise((resolve) => {
      Alert.alert(
        'Delete Recording?',
        'This recording will be permanently deleted. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete from Livepeer if asset exists
                if (recording.providerAssetId) {
                  const functions = getFunctions();
                  const deleteLivepeerAsset = httpsCallable(functions, 'deleteLivepeerAsset');
                  
                  await deleteLivepeerAsset({
                    assetId: recording.providerAssetId,
                    recordingId,
                  });
                } else {
                  // Just mark as deleted in Firestore
                  await deleteRecordingService(recordingId, user.uid, reason);
                }
                
                Alert.alert('Success', 'Recording deleted.');
                resolve(true);
              } catch (err: any) {
                console.error('[useRecording] Delete error:', err);
                Alert.alert('Error', err.message || 'Failed to delete recording.');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }, [user?.uid, recordings, role]);
  
  // ---------------------------------------------------------------------------
  // REFRESH
  // ---------------------------------------------------------------------------
  
  const refresh = useCallback(async () => {
    await loadRecordings(true);
  }, [loadRecordings]);
  
  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  
  return {
    recordings,
    isLoading,
    isRefreshing,
    error,
    canManage,
    updateRecording,
    deleteRecording,
    refresh,
    loadMore,
    hasMore,
  };
}

export default useRecording;

