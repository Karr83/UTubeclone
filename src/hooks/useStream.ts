/**
 * useStream Hook
 * 
 * This hook provides streaming functionality for CREATORS.
 * It manages the stream lifecycle: create, go live, end stream.
 * 
 * USAGE:
 * ```tsx
 * const {
 *   currentStream,
 *   isLoading,
 *   createStream,
 *   goLive,
 *   endStream,
 *   obsSetup,
 * } = useStream();
 * ```
 * 
 * STREAM LIFECYCLE:
 * 1. createStream() → status: 'configuring'
 * 2. Creator connects OBS to RTMP URL
 * 3. Livepeer webhook detects stream → status: 'live'
 * 4. endStream() → status: 'ended'
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../contexts/MembershipContext';
import {
  Stream,
  StreamStatus,
  CreateStreamConfig,
  UpdateStreamData,
  OBSSetupInfo,
} from '../types/streaming';
import {
  createStream as createStreamService,
  getCreatorCurrentStream,
  getCreatorStreamKey,
  updateStream as updateStreamService,
  setStreamLive,
  endStream as endStreamService,
  deleteStream as deleteStreamService,
  regenerateStreamKey as regenerateKeyService,
  getOBSSetupInfo,
  subscribeToStream,
} from '../services/streaming.service';

// =============================================================================
// TYPES
// =============================================================================

interface UseStreamResult {
  /** Current active stream (if any) */
  currentStream: Stream | null;
  
  /** Whether data is loading */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Whether user can stream (is creator with right tier) */
  canStream: boolean;
  
  /** Whether currently live */
  isLive: boolean;
  
  /** OBS setup information */
  obsSetup: OBSSetupInfo | null;
  
  /** Create a new stream */
  createStream: (config: CreateStreamConfig) => Promise<Stream | null>;
  
  /** Manually mark stream as live (usually handled by webhook) */
  goLive: () => Promise<void>;
  
  /** End the current stream */
  endStream: () => Promise<void>;
  
  /** Update stream settings */
  updateStream: (data: UpdateStreamData) => Promise<void>;
  
  /** Delete stream */
  deleteStream: () => Promise<void>;
  
  /** Regenerate stream key (if compromised) */
  regenerateKey: () => Promise<string | null>;
  
  /** Refresh stream data */
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useStream(): UseStreamResult {
  const { user, role, profile } = useAuth();
  const { canAccess, hasMinTier } = useMembership();
  
  // State
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state
  const isCreator = role === 'creator';
  const canStream = isCreator && hasMinTier('basic') && profile?.status !== 'suspended';
  const isLive = currentStream?.status === 'live';
  
  // OBS setup info
  const obsSetup = useMemo<OBSSetupInfo | null>(() => {
    if (!currentStream?.streamKey) return null;
    return getOBSSetupInfo(currentStream.streamKey);
  }, [currentStream?.streamKey]);
  
  // ---------------------------------------------------------------------------
  // LOAD CURRENT STREAM
  // ---------------------------------------------------------------------------
  
  const loadCurrentStream = useCallback(async () => {
    if (!user?.uid || !isCreator) {
      setCurrentStream(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await getCreatorCurrentStream(user.uid);
      setCurrentStream(stream);
      
      // Also load stream key
      const key = await getCreatorStreamKey(user.uid);
      setStreamKey(key?.key || null);
    } catch (err: any) {
      console.error('[useStream] Load error:', err);
      setError(err.message || 'Failed to load stream');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isCreator]);
  
  // Load on mount
  useEffect(() => {
    loadCurrentStream();
  }, [loadCurrentStream]);
  
  // Subscribe to real-time updates if we have a stream
  useEffect(() => {
    if (!currentStream?.id) return;
    
    const unsubscribe = subscribeToStream(currentStream.id, (stream) => {
      if (stream) {
        setCurrentStream(stream);
      }
    });
    
    return () => unsubscribe();
  }, [currentStream?.id]);
  
  // ---------------------------------------------------------------------------
  // CREATE STREAM
  // ---------------------------------------------------------------------------
  
  const createStream = useCallback(async (
    config: CreateStreamConfig
  ): Promise<Stream | null> => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in.');
      return null;
    }
    
    if (!canStream) {
      Alert.alert(
        'Cannot Stream',
        'You need to be a creator with at least Basic tier to stream.'
      );
      return null;
    }
    
    // Check if there's already an active stream
    if (currentStream && currentStream.status !== 'ended') {
      Alert.alert(
        'Stream Exists',
        'You already have an active stream. End it first to create a new one.'
      );
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await createStreamService(user.uid, config);
      setCurrentStream(stream);
      setStreamKey(stream.streamKey);
      
      return stream;
    } catch (err: any) {
      console.error('[useStream] Create error:', err);
      setError(err.message || 'Failed to create stream');
      Alert.alert('Error', err.message || 'Failed to create stream.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, canStream, currentStream]);
  
  // ---------------------------------------------------------------------------
  // GO LIVE (Manual trigger - usually handled by webhook)
  // ---------------------------------------------------------------------------
  
  const goLive = useCallback(async () => {
    if (!currentStream) {
      Alert.alert('Error', 'No stream to go live with.');
      return;
    }
    
    if (currentStream.status === 'live') {
      return; // Already live
    }
    
    try {
      await setStreamLive(currentStream.id);
      setCurrentStream((prev) => prev ? { ...prev, status: 'live' } : null);
    } catch (err: any) {
      console.error('[useStream] Go live error:', err);
      Alert.alert('Error', err.message || 'Failed to go live.');
    }
  }, [currentStream]);
  
  // ---------------------------------------------------------------------------
  // END STREAM
  // ---------------------------------------------------------------------------
  
  const endStream = useCallback(async () => {
    if (!currentStream) {
      return;
    }
    
    try {
      await endStreamService(currentStream.id);
      setCurrentStream((prev) => prev ? { ...prev, status: 'ended' } : null);
    } catch (err: any) {
      console.error('[useStream] End stream error:', err);
      Alert.alert('Error', err.message || 'Failed to end stream.');
    }
  }, [currentStream]);
  
  // ---------------------------------------------------------------------------
  // UPDATE STREAM
  // ---------------------------------------------------------------------------
  
  const updateStream = useCallback(async (data: UpdateStreamData) => {
    if (!currentStream) {
      Alert.alert('Error', 'No stream to update.');
      return;
    }
    
    try {
      await updateStreamService(currentStream.id, data);
      setCurrentStream((prev) => prev ? { ...prev, ...data } : null);
    } catch (err: any) {
      console.error('[useStream] Update error:', err);
      Alert.alert('Error', err.message || 'Failed to update stream.');
    }
  }, [currentStream]);
  
  // ---------------------------------------------------------------------------
  // DELETE STREAM
  // ---------------------------------------------------------------------------
  
  const deleteStream = useCallback(async () => {
    if (!currentStream) {
      return;
    }
    
    // Confirm deletion
    Alert.alert(
      'Delete Stream?',
      'This will permanently delete the stream. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStreamService(currentStream.id);
              setCurrentStream(null);
            } catch (err: any) {
              console.error('[useStream] Delete error:', err);
              Alert.alert('Error', err.message || 'Failed to delete stream.');
            }
          },
        },
      ]
    );
  }, [currentStream]);
  
  // ---------------------------------------------------------------------------
  // REGENERATE KEY
  // ---------------------------------------------------------------------------
  
  const regenerateKey = useCallback(async (): Promise<string | null> => {
    if (!user?.uid) {
      return null;
    }
    
    // Confirm regeneration
    return new Promise((resolve) => {
      Alert.alert(
        'Regenerate Stream Key?',
        'Your current stream key will be invalidated. You will need to update OBS settings.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          {
            text: 'Regenerate',
            onPress: async () => {
              try {
                const newKey = await regenerateKeyService(user.uid);
                setStreamKey(newKey);
                resolve(newKey);
              } catch (err: any) {
                console.error('[useStream] Regenerate key error:', err);
                Alert.alert('Error', err.message || 'Failed to regenerate key.');
                resolve(null);
              }
            },
          },
        ]
      );
    });
  }, [user?.uid]);
  
  // ---------------------------------------------------------------------------
  // REFRESH
  // ---------------------------------------------------------------------------
  
  const refresh = useCallback(async () => {
    await loadCurrentStream();
  }, [loadCurrentStream]);
  
  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  
  return {
    currentStream,
    isLoading,
    error,
    canStream,
    isLive,
    obsSetup,
    createStream,
    goLive,
    endStream,
    updateStream,
    deleteStream,
    regenerateKey,
    refresh,
  };
}

export default useStream;

