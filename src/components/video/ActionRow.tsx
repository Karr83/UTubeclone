/**
 * ActionRow Component
 * 
 * Like, dislike, share, save action buttons.
 * YouTube-style pill buttons with horizontal scroll.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface ActionRowProps {
  /** Like count (number or formatted string) */
  likeCount: number | string;
  /** Dislike count (optional) */
  dislikeCount?: number | string;
  /** Is the video liked by user */
  isLiked?: boolean;
  /** Is the video disliked by user */
  isDisliked?: boolean;
  /** Is the video saved to playlist */
  isSaved?: boolean;
  /** Callback when like tapped */
  onLike?: () => void;
  /** Callback when dislike tapped */
  onDislike?: () => void;
  /** Callback when share tapped */
  onShare?: () => void;
  /** Callback when save tapped */
  onSave?: () => void;
  /** Callback when more tapped */
  onMore?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCount = (count: number | string): string => {
  if (typeof count === 'string') return count;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ActionRow({
  likeCount,
  dislikeCount,
  isLiked = false,
  isDisliked = false,
  isSaved = false,
  onLike,
  onDislike,
  onShare,
  onSave,
  onMore,
}: ActionRowProps): JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Like/Dislike Combined Button */}
        <View style={styles.likeDislikeContainer}>
          <TouchableOpacity style={styles.likeButton} onPress={onLike}>
            <Text style={[styles.actionIcon, isLiked && styles.actionIconActive]}>👍</Text>
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {formatCount(likeCount)}
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.dislikeButton} onPress={onDislike}>
            <Text style={[styles.actionIcon, isDisliked && styles.actionIconActive]}>👎</Text>
            {dislikeCount !== undefined && (
              <Text style={[styles.actionText, isDisliked && styles.actionTextActive]}>
                {formatCount(dislikeCount)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <Text style={[styles.actionIcon, isSaved && styles.actionIconActive]}>
            {isSaved ? '✓' : '≡+'}
          </Text>
          <Text style={[styles.actionText, isSaved && styles.actionTextActive]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        {/* More */}
        <TouchableOpacity style={styles.actionButton} onPress={onMore}>
          <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.divider,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  likeDislikeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.chipBackground,
    borderRadius: 20,
    overflow: 'hidden',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 6,
  },
  dislikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 12,
    gap: 6,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: darkTheme.semantic.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.youtube.chipBackground,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionIconActive: {
    color: darkTheme.youtube.blue,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: darkTheme.semantic.text,
  },
  actionTextActive: {
    color: darkTheme.youtube.blue,
  },
  moreIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    letterSpacing: 1,
  },
});
