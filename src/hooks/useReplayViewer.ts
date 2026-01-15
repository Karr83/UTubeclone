/**
 * useReplayViewer Hook
 * 
 * This hook provides replay/VOD viewing functionality for users.
 * It handles loading recordings, checking permissions, and tracking views.
 * 
 * USAGE:
 * ```tsx
 * const {
 *   recording,
 *   playbackUrl,
 *   isLoading,
 *   isAvailable,
 *   error,
 *   loadRecording,
 *   trackView,
 * } = useReplayViewer();
 * ```
 * 
 * FEATURES:
 * - Load recording by ID
 * - Permission checking
 * - View tracking
 * - Real-time status updates (for processing recordings)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../contexts/MembershipContext';
import { Recording } from '../types/recording';
import {
  getRecording,
  subscribeToRecording,
  canViewRecording,
  trackView as trackViewService,
  updatePlaybackProgress,
  formatDuration,
  formatFileSize,
} from '../services/recording.service';

// =============================================================================
// TYPES
// =============================================================================

interface UseReplayViewerResult {
  /** Current recording */
  recording: Recording | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Playback URL (if available) */
  playbackUrl: string | null;
  
  /** Whether recording is available for playback */
  isAvailable: boolean;
  
  /** Whether recording is processing */
  isProcessing: boolean;
  
  /** Whether recording is deleted or unavailable */
  isUnavailable: boolean;
  
  /** Permission denial reason */
  permissionDenied: string | null;
  
  /** Formatted duration */
  formattedDuration: string;
  
  /** Formatted file size */
  formattedFileSize: string;
  
  /** Load a recording by ID */
  loadRecording: (recordingId: string) => Promise<boolean>;
  
  /** Track view (call when playback starts) */
  trackView: () => Promise<void>;
  
  /** Update playback progress */
  updateProgress: (seconds: number, completed?: boolean) => Promise<void>;
  
  /** Clear current recording */
  clear: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useReplayViewer(): UseReplayViewerResult {
  const { user, role } = useAuth();
  const { tier } = useMembership();
  
  // State
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
  
  // Tracking ref
  const sessionIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Derived state
  const isAvailable = recording?.status === 'ready' && !permissionDenied;
  const isProcessing = recording?.status === 'processing' || recording?.status === 'pending';
  const isUnavailable = recording?.status === 'deleted' || 
                        recording?.status === 'failed' || 
                        recording?.isDeleted ||
                        recording?.isHidden ||
                        !!permissionDenied;
  
  const playbackUrl = isAvailable ? recording?.playbackUrl || null : null;
  
  const formattedDuration = recording 
    ? formatDuration(recording.durationSeconds) 
    : '0:00';
    
  const formattedFileSize = recording 
    ? formatFileSize(recording.fileSizeBytes) 
    : 'Unknown';
  
  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    return () => {
      // Cleanup subscription on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
  
  // ---------------------------------------------------------------------------
  // LOAD RECORDING
  // ---------------------------------------------------------------------------
  
  const loadRecording = useCallback(async (recordingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setPermissionDenied(null);
    
    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    try {
      // Fetch recording
      const rec = await getRecording(recordingId);
      
      if (!rec) {
        setError('Recording not found.');
        setRecording(null);
        setIsLoading(false);
        return false;
      }
      
      // Check permissions
      const { canView, reason } = await canViewRecording(
        rec,
        user?.uid,
        tier,
        role || undefined
      );
      
      if (!canView) {
        setPermissionDenied(reason || 'Cannot access this recording.');
      }
      
      setRecording(rec);
      
      // Subscribe to real-time updates (for processing recordings)
      if (rec.status === 'processing' || rec.status === 'pending') {
        unsubscribeRef.current = subscribeToRecording(recordingId, (updated) => {
          if (updated) {
            setRecording(updated);
            
            // Re-check permissions if recording becomes available
            if (updated.status === 'ready' && permissionDenied) {
              canViewRecording(updated, user?.uid, tier, role || undefined)
                .then(({ canView, reason }) => {
                  if (canView) {
                    setPermissionDenied(null);
                  } else {
                    setPermissionDenied(reason || 'Cannot access this recording.');
                  }
                });
            }
          }
        });
      }
      
      setIsLoading(false);
      return canView;
    } catch (err: any) {
      console.error('[useReplayViewer] Load error:', err);
      setError(err.message || 'Failed to load recording.');
      setRecording(null);
      setIsLoading(false);
      return false;
    }
  }, [user?.uid, tier, role, permissionDenied]);
  
  // ---------------------------------------------------------------------------
  // TRACK VIEW
  // ---------------------------------------------------------------------------
  
  const trackView = useCallback(async () => {
    if (!recording || !isAvailable) return;
    
    // Only track once per session
    if (sessionIdRef.current) return;
    
    try {
      const sessionId = await trackViewService(recording.id, user?.uid);
      sessionIdRef.current = sessionId;
      
      console.log('[useReplayViewer] View tracked, session:', sessionId);
    } catch (err) {
      console.error('[useReplayViewer] Track view error:', err);
    }
  }, [recording, isAvailable, user?.uid]);
  
  // ---------------------------------------------------------------------------
  // UPDATE PROGRESS
  // ---------------------------------------------------------------------------
  
  const updateProgress = useCallback(async (
    seconds: number,
    completed: boolean = false
  ) => {
    if (!recording || !sessionIdRef.current) return;
    
    try {
      await updatePlaybackProgress(
        recording.id,
        sessionIdRef.current,
        seconds,
        completed
      );
    } catch (err) {
      // Silent fail - progress tracking is not critical
      console.debug('[useReplayViewer] Update progress error:', err);
    }
  }, [recording]);
  
  // ---------------------------------------------------------------------------
  // CLEAR
  // ---------------------------------------------------------------------------
  
  const clear = useCallback(() => {
    // Cleanup subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Reset state
    setRecording(null);
    setError(null);
    setPermissionDenied(null);
    sessionIdRef.current = null;
  }, []);
  
  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  
  return {
    recording,
    isLoading,
    error,
    playbackUrl,
    isAvailable,
    isProcessing,
    isUnavailable,
    permissionDenied,
    formattedDuration,
    formattedFileSize,
    loadRecording,
    trackView,
    updateProgress,
    clear,
  };
}

export default useReplayViewer;

