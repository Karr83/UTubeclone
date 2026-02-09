/**
 * Video Components
 * 
 * Reusable UI components for video watch pages and lists.
 * Based on YouTube mobile design patterns.
 */

// Watch page components
export { VideoPlayer } from './VideoPlayer';
export type { VideoPlayerProps, VideoPlayerMode, VideoSource } from './VideoPlayer';
export { VideoMeta } from './VideoMeta';
export { ActionRow } from './ActionRow';
export { CreatorInfo } from './CreatorInfo';
export { Description } from './Description';
export { CommentsPreview } from './CommentsPreview';
export { CommentItem } from './CommentItem';
export { VideoDescription } from './VideoDescription';
export type { VideoDescriptionProps } from './VideoDescription';

// List/card components
export { VideoCard } from './VideoCard';
export type { VideoCardProps, VideoCardVariant } from './VideoCard';
export { SmallVideoCard } from './SmallVideoCard';
export type { SmallVideoCardProps } from './SmallVideoCard';

// Dropdown/Menu components
export { VideoPageIconsDropdown, createVideoMenuItems } from './VideoPageIconsDropdown';
export type { VideoPageIconsDropdownProps, DropdownMenuItem } from './VideoPageIconsDropdown';

// Icon components
export { VideoPageMoreIcon } from './VideoPageMoreIcon';
export type { VideoPageMoreIconProps } from './VideoPageMoreIcon';
export { VideoPageSaveIcon } from './VideoPageSaveIcon';
export type { VideoPageSaveIconProps } from './VideoPageSaveIcon';
export { VideoPageShareIcon } from './VideoPageShareIcon';
export type { VideoPageShareIconProps } from './VideoPageShareIcon';
export { VideoPageDislikeIcon } from './VideoPageDislikeIcon';
export type { VideoPageDislikeIconProps } from './VideoPageDislikeIcon';
export { VideoPageLikeIcon } from './VideoPageLikeIcon';
export type { VideoPageLikeIconProps } from './VideoPageLikeIcon';