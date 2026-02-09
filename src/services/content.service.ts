/**
 * Content Service
 * 
 * This service handles all content-related operations including:
 * - Uploading media files to Firebase Storage
 * - Storing content metadata in Firestore
 * - Querying and retrieving content
 * - Access control based on visibility settings
 * 
 * ARCHITECTURE:
 * 1. Media files are uploaded to Firebase Storage at:
 *    /content/{creatorId}/{contentId}/{filename}
 * 2. Content metadata is stored in Firestore at:
 *    /content/{contentId}
 * 
 * ROLE & MEMBERSHIP CHECKS:
 * - uploadContent() requires creator role + membership tier
 * - getPublicContent() is available to everyone
 * - getMembersOnlyContent() requires authentication
 * 
 * FUTURE STREAMING PREPARATION:
 * - Storage structure supports video files
 * - Content model includes placeholders for stream fields
 * - Service can be extended for live stream management
 * 
 * FUTURE MONETIZATION PREPARATION:
 * - Visibility field supports tier-gated content
 * - Content model includes revenue tracking placeholders
 * - Access control can check subscription status
 * 
 * TODO Phase 3: Add content caching with offline support
 * TODO Phase 3: Add content recommendations algorithm
 * TODO Phase 3: Add content compression/optimization pipeline
 * TODO Phase 3: Add content analytics tracking
 */

/* PHASE 2: Firebase imports commented out
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
*/

// PHASE 3B: Import real Firebase functions
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { firestore, storage } from '../config/firebase';
import {
  Content,
  CreateContentData,
  UpdateContentData,
  ContentQueryOptions,
  ContentListResponse,
  UploadProgress,
  UploadResult,
  ContentStatus,
  MediaType,
  ContentVisibility,
} from '../types/content';

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

/** Firestore collection for content documents */
const CONTENT_COLLECTION = 'content';

/** Firebase Storage folder for content media */
const STORAGE_CONTENT_FOLDER = 'content';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique content ID.
 */
function generateContentId(): string {
  return doc(collection(firestore, CONTENT_COLLECTION)).id;
}

/**
 * Get the file extension from a URI or filename.
 */
function getFileExtension(uri: string): string {
  const parts = uri.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || 'jpg' : 'jpg';
}

/**
 * Determine media type from file extension.
 */
function getMediaTypeFromExtension(extension: string): MediaType {
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
  return videoExtensions.includes(extension) ? 'video' : 'image';
}

/**
 * Convert Firestore document to Content object.
 */
function docToContent(docId: string, data: any): Content {
  return {
    id: docId,
    creatorId: data.creatorId,
    title: data.title,
    description: data.description,
    mediaType: data.mediaType,
    mediaUrl: data.mediaUrl,
    thumbnailUrl: data.thumbnailUrl,
    visibility: data.visibility,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate(),
    publishedAt: data.publishedAt?.toDate(),
    viewCount: data.viewCount || 0,
    likeCount: data.likeCount || 0,
    commentCount: data.commentCount || 0,
    // Boost fields
    isBoosted: data.isBoosted || false,
    boostLevel: data.boostLevel || 0,
    boostedAt: data.boostedAt?.toDate(),
    boostedBy: data.boostedBy,
    boostExpiresAt: data.boostExpiresAt?.toDate() || null,
  };
}

/**
 * Convert a local file URI to a Blob for upload.
 * Works with Expo's file system URIs.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

// =============================================================================
// CONTENT SERVICE
// =============================================================================

export const contentService = {
  /**
   * Upload new content with media file.
   * 
   * This function:
   * 1. Uploads the media file to Firebase Storage
   * 2. Creates a content document in Firestore
   * 3. Returns the created content with download URL
   * 
   * IMPORTANT: Caller must verify creator role before calling!
   * Use the hook useCanUpload() or check manually:
   *   if (profile?.role !== 'creator') throw new Error('...')
   * 
   * @param creatorId - The creator's user ID
   * @param data - Content data including local media URI
   * @param onProgress - Optional callback for upload progress
   * @returns The created content with URLs
   * 
   * @example
   * const result = await contentService.uploadContent(
   *   user.uid,
   *   {
   *     title: 'My Photo',
   *     description: 'A beautiful sunset',
   *     mediaType: 'image',
   *     localMediaUri: 'file:///path/to/image.jpg',
   *     visibility: 'public',
   *   },
   *   (progress) => console.log(`${progress.progress}%`)
   * );
   */
  uploadContent: async (
    creatorId: string,
    data: CreateContentData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> => {
    // PHASE 3B: Return error if Firebase is not initialized
    if (!firestore || !storage) {
      console.log('⚠️ Firebase offline, cannot upload content');
      return {
        success: false,
        error: 'Firebase not initialized. Please check your configuration.',
      };
    }

    // Generate unique content ID
    const contentId = generateContentId();
    
    // Determine file extension and type
    const extension = getFileExtension(data.localMediaUri);
    const filename = `media.${extension}`;
    
    // Create storage path: /content/{creatorId}/{contentId}/media.ext
    const storagePath = `${STORAGE_CONTENT_FOLDER}/${creatorId}/${contentId}/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    try {
      // Convert local URI to blob
      const blob = await uriToBlob(data.localMediaUri);
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // Track progress
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              progress: Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              ),
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: 'uploading',
            };
            onProgress?.(progress);
          },
          (error) => {
            onProgress?.({
              progress: 0,
              bytesTransferred: 0,
              totalBytes: 0,
              state: 'error',
              error: error.message,
            });
            reject(error);
          },
          () => {
            onProgress?.({
              progress: 100,
              bytesTransferred: uploadTask.snapshot.totalBytes,
              totalBytes: uploadTask.snapshot.totalBytes,
              state: 'success',
            });
            resolve();
          }
        );
      });
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Create Firestore document
      const contentDoc: Omit<Content, 'id' | 'createdAt' | 'updatedAt'> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        publishedAt: ReturnType<typeof serverTimestamp>;
      } = {
        creatorId,
        title: data.title,
        description: data.description,
        mediaType: data.mediaType,
        mediaUrl: downloadUrl,
        visibility: data.visibility,
        status: 'pending', // Requires admin approval before publishing
        moderationStatus: 'pending', // For admin moderation queue
        createdAt: serverTimestamp(),
        // publishedAt will be set when admin approves
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        reportCount: 0, // For admin moderation tracking
        // Boost fields - default to not boosted
        isBoosted: false,
        boostLevel: 0,
        boostedAt: null,
        boostedBy: null,
        boostExpiresAt: null,
      };
      
      await setDoc(doc(firestore, CONTENT_COLLECTION, contentId), contentDoc);
      
      // Return result
      const content: Content = {
        ...contentDoc,
        id: contentId,
        createdAt: new Date(),
        // publishedAt not set - content is pending moderation
      };
      
      return {
        content,
        downloadUrl,
        storagePath,
      };
    } catch (error: any) {
      console.error('Error uploading content:', error);
      throw new Error(`Failed to upload content: ${error.message}`);
    }
  },

  /**
   * Get a single content item by ID.
   * 
   * @param contentId - The content document ID
   * @returns The content or null if not found
   */
  getContentById: async (contentId: string): Promise<Content | null> => {
    try {
      if (!firestore) {
        console.log('⚠️ Firebase offline, returning null for content ID:', contentId);
        return null;
      }

      const docRef = doc(firestore, CONTENT_COLLECTION, contentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docToContent(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error fetching content:', error);
      return null;
    }
  },

  /**
   * Get all public content (visible to everyone).
   * 
   * This is the main feed for unauthenticated users.
   * Returns only published content with public visibility.
   * 
   * @param options - Query options (limit, pagination, etc.)
   * @returns Paginated list of public content
   */
  getPublicContent: async (
    options: ContentQueryOptions = {}
  ): Promise<ContentListResponse> => {
    // PHASE 3B: Return empty list if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, returning empty public content');
      return { items: [], hasMore: false };
    }

    try {

      const constraints: QueryConstraint[] = [
        where('visibility', '==', 'public'),
        where('status', '==', 'published'),
        orderBy(options.orderBy || 'createdAt', options.orderDirection || 'desc'),
        limit(options.limit || 20),
      ];
      
      // Add pagination cursor if provided
      if (options.startAfter) {
        const lastDoc = await getDoc(
          doc(firestore, CONTENT_COLLECTION, options.startAfter)
        );
        if (lastDoc.exists()) {
          constraints.push(startAfter(lastDoc));
        }
      }
      
      const q = query(collection(firestore, CONTENT_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const items: Content[] = snapshot.docs.map((doc) =>
        docToContent(doc.id, doc.data())
      );
      
      return {
        items,
        hasMore: items.length === (options.limit || 20),
        lastId: items.length > 0 ? items[items.length - 1].id : undefined,
      };
    } catch (error: any) {
      // PHASE 3B: Handle permission errors gracefully (Firestore rules not set up yet)
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.log('⚠️ Firestore permissions not configured, using empty content');
      } else {
        console.error('Error fetching public content:', error);
      }
      return { items: [], hasMore: false };
    }
  },

  /**
   * Get content by a specific creator.
   * 
   * Returns all content for a creator, filtered by status.
   * Use for creator's own content management or public profile.
   * 
   * @param creatorId - The creator's user ID
   * @param options - Query options
   * @returns Paginated list of creator's content
   */
  getCreatorContent: async (
    creatorId: string,
    options: ContentQueryOptions = {}
  ): Promise<ContentListResponse> => {
    try {
      if (!firestore) {
        console.log('⚠️ Firebase offline, returning empty creator content');
        return { items: [], hasMore: false };
      }

      const constraints: QueryConstraint[] = [
        where('creatorId', '==', creatorId),
        orderBy(options.orderBy || 'createdAt', options.orderDirection || 'desc'),
        limit(options.limit || 20),
      ];
      
      // Filter by status if provided
      if (options.status) {
        constraints.splice(1, 0, where('status', '==', options.status));
      }
      
      // Filter by visibility if provided
      if (options.visibility) {
        constraints.splice(1, 0, where('visibility', '==', options.visibility));
      }
      
      // Add pagination cursor
      if (options.startAfter) {
        const lastDoc = await getDoc(
          doc(firestore, CONTENT_COLLECTION, options.startAfter)
        );
        if (lastDoc.exists()) {
          constraints.push(startAfter(lastDoc));
        }
      }
      
      const q = query(collection(firestore, CONTENT_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const items: Content[] = snapshot.docs.map((doc) =>
        docToContent(doc.id, doc.data())
      );
      
      return {
        items,
        hasMore: items.length === (options.limit || 20),
        lastId: items.length > 0 ? items[items.length - 1].id : undefined,
      };
    } catch (error: any) {
      // PHASE 3B: Handle permission errors gracefully (Firestore rules not set up yet)
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.log('⚠️ Firestore permissions not configured, using empty creator content');
      } else {
        console.error('Error fetching creator content:', error);
      }
      return { items: [], hasMore: false };
    }
  },

  /**
   * Get members-only content feed.
   * 
   * Returns content that requires membership to view.
   * Caller must verify user is authenticated before calling.
   * 
   * @param options - Query options
   * @returns Paginated list of members-only content
   */
  getMembersOnlyContent: async (
    options: ContentQueryOptions = {}
  ): Promise<ContentListResponse> => {
    // PHASE 3B: Return empty list if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, returning empty members-only content');
      return { items: [], hasMore: false };
    }

    try {
      const constraints: QueryConstraint[] = [
        where('visibility', '==', 'membersOnly'),
        where('status', '==', 'published'),
        orderBy(options.orderBy || 'createdAt', options.orderDirection || 'desc'),
        limit(options.limit || 20),
      ];
      
      if (options.startAfter) {
        const lastDoc = await getDoc(
          doc(firestore, CONTENT_COLLECTION, options.startAfter)
        );
        if (lastDoc.exists()) {
          constraints.push(startAfter(lastDoc));
        }
      }
      
      const q = query(collection(firestore, CONTENT_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const items: Content[] = snapshot.docs.map((doc) =>
        docToContent(doc.id, doc.data())
      );
      
      return {
        items,
        hasMore: items.length === (options.limit || 20),
        lastId: items.length > 0 ? items[items.length - 1].id : undefined,
      };
    } catch (error: any) {
      // PHASE 3B: Handle permission errors gracefully (Firestore rules not set up yet)
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.log('⚠️ Firestore permissions not configured, using empty members-only content');
      } else {
        console.error('Error fetching members-only content:', error);
      }
      return { items: [], hasMore: false };
    }
  },

  /**
   * Update content metadata.
   * 
   * @param contentId - The content document ID
   * @param data - Fields to update
   */
  updateContent: async (
    contentId: string,
    data: UpdateContentData
  ): Promise<void> => {
    // PHASE 3B: Throw error if Firebase is not initialized
    if (!firestore) {
      throw new Error('Firebase not initialized. Please check your configuration.');
    }

    try {
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(doc(firestore, CONTENT_COLLECTION, contentId), updateData);
    } catch (error: any) {
      console.error('Error updating content:', error);
      throw new Error(`Failed to update content: ${error.message}`);
    }
  },

  /**
   * Delete content (soft delete by changing status).
   * 
   * @param contentId - The content document ID
   */
  deleteContent: async (contentId: string): Promise<void> => {
    // PHASE 3B: Throw error if Firebase is not initialized
    if (!firestore) {
      throw new Error('Firebase not initialized. Please check your configuration.');
    }

    try {
      await updateDoc(doc(firestore, CONTENT_COLLECTION, contentId), {
        status: 'removed',
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error deleting content:', error);
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  },

  /**
   * Permanently delete content including media file.
   * Use with caution - this cannot be undone.
   * 
   * @param contentId - The content document ID
   * @param storagePath - The Firebase Storage path to delete
   */
  permanentlyDeleteContent: async (
    contentId: string,
    storagePath: string
  ): Promise<void> => {
    // PHASE 3B: Throw error if Firebase is not initialized
    if (!firestore || !storage) {
      throw new Error('Firebase not initialized. Please check your configuration.');
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(firestore, CONTENT_COLLECTION, contentId));
      
      // Delete from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error: any) {
      console.error('Error permanently deleting content:', error);
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  },

  /**
   * Increment view count for content.
   * In production, use Cloud Functions to prevent abuse.
   * 
   * @param contentId - The content document ID
   */
  incrementViewCount: async (contentId: string): Promise<void> => {
    // PHASE 3B: Skip view count increment if Firebase is not initialized
    if (!firestore) {
      console.log('⚠️ Firebase offline, skipping view count increment');
      return;
    }

    try {
      const docRef = doc(firestore, CONTENT_COLLECTION, contentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().viewCount || 0;
        await updateDoc(docRef, {
          viewCount: currentViews + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw - view count is not critical
    }
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default contentService;

