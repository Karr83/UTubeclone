/**
 * useStreamViewer Hook
 * 
 * This hook provides streaming functionality for VIEWERS.
 * It handles joining streams, tracking viewer sessions, and real-time updates.
 * 
 * USAGE:
 * ```tsx
 * const {
 *   stream,
 *   isLive,
 *   playbackUrl,
 *   viewerCount,
 *   joinStream,
 *   leaveStream,
 * } = useStreamViewer();
 * ```
 * 
 * VIEWER FLOW:
 * 1. User navigates to stream
 * 2. joinStream(streamId) is called
 * 3. Hook subscribes to real-time stream updates
 * 4. Viewer count is incremented
 * 5. On unmount/leave, viewer count is decremented
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../contexts/MembershipContext';
import {
  Stream,
  ViewerSession,
} from '../types/streaming';
import {
  getStream,
  joinAsViewer,
  leaveAsViewer,
  subscribeToStream,
  canViewStream,
} from '../services/streaming.service';

// =============================================================================
// TYPES
// =============================================================================

interface UseStreamViewerResult {
  /** Stream being watched */
  stream: Stream | null;
  
  /** Whether stream data is loading */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Whether stream is currently live */
  isLive: boolean;
  
  /** Whether stream has ended */
  hasEnded: boolean;
  
  /** HLS playback URL */
  playbackUrl: string | null;
  
  /** Current viewer count */
  viewerCount: number;
  
  /** Whether user can view this stream */
  canView: boolean;
  
  /** Join a stream as viewer */
  joinStream: (streamId: string) => Promise<boolean>;
  
  /** Leave the current stream */
  leaveStream: () => void;
  
  /** Refresh stream data */
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useStreamViewer(): UseStreamViewerResult {
  const { user } = useAuth();
  const { tier } = useMembership();
  
  // State
  const [stream, setStream] = useState<Stream | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const streamIdRef = useRef<string | null>(null);
  
  // Derived state
  const isLive = stream?.status === 'live';
  const hasEnded = stream?.status === 'ended';
  const playbackUrl = stream?.playbackUrl || null;
  const viewerCount = stream?.viewerCount || 0;
  
  // Check if user can view this stream
  const canView = stream ? canViewStream(stream, user?.uid, tier) : false;
  
  // ---------------------------------------------------------------------------
  // CLEANUP FUNCTION
  // ---------------------------------------------------------------------------
  
  const cleanup = useCallback(() => {
    // Unsubscribe from real-time updates
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Leave as viewer (decrement count)
    if (streamIdRef.current && viewerId) {
      leaveAsViewer(streamIdRef.current, viewerId).catch((err) => {
        console.warn('[useStreamViewer] Failed to leave stream:', err);
      });
    }
    
    streamIdRef.current = null;
    setViewerId(null);
  }, [viewerId]);
  
  // ---------------------------------------------------------------------------
  // JOIN STREAM
  // ---------------------------------------------------------------------------
  
  const joinStream = useCallback(async (streamId: string): Promise<boolean> => {
    // Clean up previous stream
    cleanup();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load stream data
      const streamData = await getStream(streamId);
      
      if (!streamData) {
        setError('Stream not found');
        setIsLoading(false);
        return false;
      }
      
      // Check if user can view
      if (!canViewStream(streamData, user?.uid, tier)) {
        if (streamData.visibility === 'members') {
          setError('This stream is for members only. Please upgrade to view.');
        } else if (streamData.isSuspended) {
          setError('This stream has been suspended.');
        } else {
          setError('You do not have access to this stream.');
        }
        setStream(streamData);
        setIsLoading(false);
        return false;
      }
      
      // Check stream status
      if (streamData.status === 'ended') {
        setError('This stream has ended.');
        setStream(streamData);
        setIsLoading(false);
        return false;
      }
      
      setStream(streamData);
      streamIdRef.current = streamId;
      
      // Register as viewer
      const newViewerId = await joinAsViewer(streamId, user?.uid);
      setViewerId(newViewerId);
      
      // Subscribe to real-time updates
      unsubscribeRef.current = subscribeToStream(streamId, (updatedStream) => {
        if (updatedStream) {
          setStream(updatedStream);
          
          // Check if stream ended
          if (updatedStream.status === 'ended') {
            setError('The stream has ended.');
          }
        } else {
          setError('Stream was deleted.');
          setStream(null);
        }
      });
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[useStreamViewer] Join error:', err);
      setError(err.message || 'Failed to join stream');
      setIsLoading(false);
      return false;
    }
  }, [user?.uid, tier, cleanup]);
  
  // ---------------------------------------------------------------------------
  // LEAVE STREAM
  // ---------------------------------------------------------------------------
  
  const leaveStream = useCallback(() => {
    cleanup();
    setStream(null);
    setError(null);
  }, [cleanup]);
  
  // ---------------------------------------------------------------------------
  // REFRESH
  // ---------------------------------------------------------------------------
  
  const refresh = useCallback(async () => {
    if (!streamIdRef.current) return;
    
    try {
      const streamData = await getStream(streamIdRef.current);
      if (streamData) {
        setStream(streamData);
      }
    } catch (err: any) {
      console.error('[useStreamViewer] Refresh error:', err);
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // APP STATE HANDLING
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    // Handle app going to background/foreground
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // App went to background - could pause viewer tracking
        console.log('[useStreamViewer] App went to background');
      } else if (nextState === 'active') {
        // App came to foreground - refresh stream
        refresh();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [refresh]);
  
  // ---------------------------------------------------------------------------
  // CLEANUP ON UNMOUNT
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  
  return {
    stream,
    isLoading,
    error,
    isLive,
    hasEnded,
    playbackUrl,
    viewerCount,
    canView,
    joinStream,
    leaveStream,
    refresh,
  };
}

export default useStreamViewer;

