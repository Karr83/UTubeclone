/**
 * Content Upload Hook
 * 
 * This hook provides content upload functionality with:
 * - Role verification (must be creator)
 * - Membership tier checks (for video uploads)
 * - Upload progress tracking
 * - Error handling
 * 
 * USAGE:
 * const { canUpload, canUploadVideo, upload, isUploading, progress } = useContentUpload();
 * 
 * if (!canUpload) {
 *   return <NotACreator />;
 * }
 * 
 * await upload({ title, mediaType, localMediaUri, visibility });
 */

import { useState, useCallback, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../contexts/MembershipContext';
import { contentService } from '../services/content.service';
import { adminService } from '../services/admin.service';
import {
  CreateContentData,
  UploadProgress,
  UploadResult,
  Content,
} from '../types/content';

// =============================================================================
// TYPES
// =============================================================================

interface UseContentUploadReturn {
  /** Whether the current user can upload content (has creator role and not suspended) */
  canUpload: boolean;
  
  /** Whether the current user can upload video content (creator + membership) */
  canUploadVideo: boolean;
  
  /** Whether user is suspended and cannot upload */
  isSuspended: boolean;
  
  /** Upload content with progress tracking */
  upload: (data: CreateContentData) => Promise<UploadResult>;
  
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  
  /** Current upload progress */
  progress: UploadProgress;
  
  /** Error message if upload failed */
  error: string | null;
  
  /** Reset upload state */
  reset: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialProgress: UploadProgress = {
  progress: 0,
  bytesTransferred: 0,
  totalBytes: 0,
  state: 'idle',
};

// =============================================================================
// HOOK
// =============================================================================

export function useContentUpload(): UseContentUploadReturn {
  // ---------------------------------------------------------------------------
  // CONTEXTS
  // ---------------------------------------------------------------------------
  
  const { user, profile } = useAuth();
  const { canAccess } = useMembership();

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  // ---------------------------------------------------------------------------
  // PERMISSIONS
  // ---------------------------------------------------------------------------

  /**
   * Check if user is suspended.
   * Suspended users cannot upload content.
   */
  useMemo(() => {
    const checkSuspension = async () => {
      if (user?.uid) {
        const canUploadResult = await adminService.canUserUpload(user.uid);
        setIsSuspended(profile?.role === 'creator' && !canUploadResult);
      }
    };
    checkSuspension();
  }, [user?.uid, profile?.role]);

  /**
   * Check if user can upload any content.
   * Requires creator role and not suspended.
   */
  const canUpload = useMemo(() => {
    return profile?.role === 'creator' && !isSuspended;
  }, [profile?.role, isSuspended]);

  /**
   * Check if user can upload video content.
   * Requires creator role + membership tier that allows video uploads.
   */
  const canUploadVideo = useMemo(() => {
    return canAccess('creator_upload_video');
  }, [canAccess]);

  // ---------------------------------------------------------------------------
  // UPLOAD FUNCTION
  // ---------------------------------------------------------------------------

  /**
   * Upload content with media file.
   * 
   * @param data - Content data including local media URI
   * @returns The uploaded content result
   * @throws Error if upload fails or user lacks permission
   */
  const upload = useCallback(
    async (data: CreateContentData): Promise<UploadResult> => {
      // Verify user is authenticated
      if (!user?.uid) {
        throw new Error('You must be logged in to upload content');
      }

      // Verify creator role and not suspended
      if (!canUpload) {
        throw new Error(
          isSuspended 
            ? 'Your account is suspended. You cannot upload content.'
            : 'Only creators can upload content'
        );
      }

      // Verify video upload permission
      if (data.mediaType === 'video' && !canUploadVideo) {
        throw new Error('Upgrade your membership to upload videos');
      }

      // Reset state
      setError(null);
      setIsUploading(true);
      setProgress({ ...initialProgress, state: 'uploading' });

      try {
        const result = await contentService.uploadContent(
          user.uid,
          data,
          (uploadProgress) => setProgress(uploadProgress)
        );

        setProgress({
          progress: 100,
          bytesTransferred: progress.totalBytes,
          totalBytes: progress.totalBytes,
          state: 'success',
        });

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Upload failed. Please try again.';
        setError(errorMessage);
        setProgress({
          ...initialProgress,
          state: 'error',
          error: errorMessage,
        });
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [user?.uid, canUpload, canUploadVideo, isSuspended, progress.totalBytes]
  );

  // ---------------------------------------------------------------------------
  // RESET FUNCTION
  // ---------------------------------------------------------------------------

  /**
   * Reset upload state to initial values.
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(initialProgress);
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    canUpload,
    canUploadVideo,
    isSuspended,
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}

export default useContentUpload;

