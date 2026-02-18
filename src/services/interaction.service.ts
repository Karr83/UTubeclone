import {
  Unsubscribe,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

export type ReactionType = 'like' | 'dislike';
export type InteractionTargetType = 'streams' | 'recordings';
export type SavedTargetType = 'stream' | 'recording';

export interface RecordingComment {
  id: string;
  userId: string;
  username: string;
  userRole: 'viewer' | 'member' | 'creator' | 'admin';
  text: string;
  createdAt: Date;
  likeCount: number;
  replyCount: number;
  isDeleted: boolean;
}

export interface InteractionReportInput {
  targetType: SavedTargetType;
  targetId: string;
  reason: string;
  details?: string;
}

export interface CreatorInteractionStats {
  subscribers: number;
}

function assertFirestoreReady() {
  if (!firestore) {
    throw new Error('Firebase not initialized');
  }
}

function getTargetRef(targetType: InteractionTargetType, targetId: string) {
  assertFirestoreReady();
  return doc(firestore!, targetType, targetId);
}

function getReactionRef(targetType: InteractionTargetType, targetId: string, userId: string) {
  return doc(getTargetRef(targetType, targetId), 'reactions', userId);
}

export async function getUserReaction(
  targetType: InteractionTargetType,
  targetId: string,
  userId: string
): Promise<ReactionType | null> {
  const reactionSnap = await getDoc(getReactionRef(targetType, targetId, userId));
  if (!reactionSnap.exists()) return null;
  const type = reactionSnap.data()?.type;
  return type === 'like' || type === 'dislike' ? type : null;
}

export async function setUserReaction(
  targetType: InteractionTargetType,
  targetId: string,
  userId: string,
  reaction: ReactionType
): Promise<ReactionType | null> {
  const reactionRef = getReactionRef(targetType, targetId, userId);
  const existing = await getDoc(reactionRef);

  if (existing.exists() && existing.data()?.type === reaction) {
    await deleteDoc(reactionRef);
    return null;
  }

  await setDoc(reactionRef, {
    userId,
    type: reaction,
    updatedAt: serverTimestamp(),
    createdAt: existing.exists() ? existing.data()?.createdAt || serverTimestamp() : serverTimestamp(),
  });
  return reaction;
}

export async function getReactionCounts(
  targetType: InteractionTargetType,
  targetId: string
): Promise<{ likeCount: number; dislikeCount: number }> {
  assertFirestoreReady();
  const reactionsRef = collection(getTargetRef(targetType, targetId), 'reactions');
  const [likesSnap, dislikesSnap] = await Promise.all([
    getDocs(query(reactionsRef, where('type', '==', 'like'))),
    getDocs(query(reactionsRef, where('type', '==', 'dislike'))),
  ]);
  return {
    likeCount: likesSnap.size,
    dislikeCount: dislikesSnap.size,
  };
}

export async function isSubscribedToCreator(userId: string, creatorId: string): Promise<boolean> {
  assertFirestoreReady();
  const subId = `${userId}_${creatorId}`;
  const subSnap = await getDoc(doc(firestore!, 'subscriptions', subId));
  return subSnap.exists();
}

export async function toggleCreatorSubscription(
  userId: string,
  creatorId: string
): Promise<boolean> {
  assertFirestoreReady();
  const subId = `${userId}_${creatorId}`;
  const subRef = doc(firestore!, 'subscriptions', subId);
  const existing = await getDoc(subRef);

  if (existing.exists()) {
    await deleteDoc(subRef);
    return false;
  }

  await setDoc(subRef, {
    userId,
    creatorId,
    tier: 'free',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function getCreatorInteractionStats(
  creatorId: string
): Promise<CreatorInteractionStats> {
  assertFirestoreReady();
  const subsRef = collection(firestore!, 'subscriptions');
  const subsSnap = await getDocs(
    query(subsRef, where('creatorId', '==', creatorId), where('isActive', '==', true))
  );

  return {
    subscribers: subsSnap.size,
  };
}

export async function addRecordingComment(
  recordingId: string,
  userId: string,
  username: string,
  text: string,
  userRole: 'viewer' | 'member' | 'creator' | 'admin' = 'viewer'
): Promise<void> {
  assertFirestoreReady();
  const commentsRef = collection(firestore!, 'recordings', recordingId, 'comments');
  await addDoc(commentsRef, {
    recordingId,
    userId,
    username,
    userRole,
    text: text.trim(),
    likeCount: 0,
    replyCount: 0,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToRecordingComments(
  recordingId: string,
  callback: (comments: RecordingComment[]) => void,
  queryLimit: number = 50
): Unsubscribe {
  assertFirestoreReady();
  const commentsRef = collection(firestore!, 'recordings', recordingId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(queryLimit));

  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs
        .map((commentDoc) => {
          const data = commentDoc.data();
          return {
            id: commentDoc.id,
            userId: data.userId,
            username: data.username || 'User',
            userRole: data.userRole || 'viewer',
            text: data.text || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isDeleted: !!data.isDeleted,
          } as RecordingComment;
        })
        .filter((comment) => !comment.isDeleted)
        .reverse();

      callback(comments);
    },
    (error) => {
      console.error('[interaction.service] Failed to subscribe comments:', error);
      callback([]);
    }
  );
}

function getSavedItemId(userId: string, targetType: SavedTargetType, targetId: string): string {
  return `${userId}_${targetType}_${targetId}`;
}

export async function isItemSaved(
  userId: string,
  targetType: SavedTargetType,
  targetId: string
): Promise<boolean> {
  assertFirestoreReady();
  const saveRef = doc(firestore!, 'savedItems', getSavedItemId(userId, targetType, targetId));
  const saveSnap = await getDoc(saveRef);
  return saveSnap.exists();
}

export async function toggleSavedItem(
  userId: string,
  targetType: SavedTargetType,
  targetId: string
): Promise<boolean> {
  assertFirestoreReady();
  const saveRef = doc(firestore!, 'savedItems', getSavedItemId(userId, targetType, targetId));
  const existing = await getDoc(saveRef);

  if (existing.exists()) {
    await deleteDoc(saveRef);
    return false;
  }

  await setDoc(saveRef, {
    userId,
    targetType,
    targetId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function submitInteractionReport(
  userId: string,
  input: InteractionReportInput
): Promise<void> {
  assertFirestoreReady();
  await addDoc(collection(firestore!, 'reports'), {
    userId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details || '',
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
